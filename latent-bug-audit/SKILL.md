# Latent Bug Audit

Find hidden bugs that work 95% of the time but explode under real conditions.

## When to Use

Run periodically, after incidents, or before deployments. Catches bugs that tests miss because they depend on network, timing, data shape, concurrency, or resource lifecycle.

## The Prompt

Audit the codebase for these **12 bug classes**, checking every file in the hot path (request handlers, getters, middleware, workers, extractors, DB operations):

---

### 1. Network I/O in Hot Paths
**Pattern:** HTTP calls (HEAD, GET, health checks) inside per-request/per-item loops.
**Why it kills:** One slow/hanging URL blocks the entire handler. Timeouts lie — DNS resolution, connection setup, and redirects can exceed the stated timeout.
**Look for:** `aiohttp`, `httpx`, `requests`, `urllib` inside getters, formatters, or middleware. `ClientSession()` per call (connection pool waste). HEAD checks in listing display code.
**Fix:** Remove, cache, or move to background. Let the consumer (e.g., Telegram) validate URLs.

### 2. Silent Data Loss
**Pattern:** `try/except` that logs a warning and `continue`s, dropping valid data.
**Why it kills:** Validation that was correct when written becomes wrong when schema changes. Items silently vanish.
**Look for:** `except ValidationError`, `except (KeyError, TypeError)` in loops that build result lists. Pydantic `model_validate()` on data from your own DB. `continue` after except in extraction loops.
**Fix:** Don't re-validate trusted data. If you must validate, fail loud (raise), don't skip.

### 3. Column/Field Amnesia
**Pattern:** Manual column lists (`SELECT a, b, c`) that must be updated when schema changes.
**Why it kills:** New fields silently missing from queries. No error, just `None` where you expected data.
**Look for:** Hardcoded column arrays, `BASIC_COLUMNS`/`RICH_COLUMNS` patterns, manual `SELECT` statements that don't use `*` or the ORM model. Dicts built with manual key lists instead of `model_dump()`.
**Fix:** `select(Model)` or `Model.__table__.columns`. One source of truth.

### 4. Session/Connection Leaks
**Pattern:** Creating new database connections, HTTP sessions, or Redis clients per request instead of using a pool.
**Why it kills:** Works fine at low load, exhausts file descriptors or connection limits under traffic.
**Look for:** `psycopg2.connect()`, `aiohttp.ClientSession()`, `httpx.AsyncClient()` inside request handlers or per-listing callbacks. Missing `async with` or `close()`. Functions that create connections in loops without pooling.
**Fix:** Module-level or dependency-injected pools/sessions. Use context managers.

### 5. Blocking I/O in Async Context
**Pattern:** Synchronous calls (file I/O, `requests.get()`, `psycopg2`) inside `async def` handlers.
**Why it kills:** Blocks the entire event loop. One slow DB query freezes all concurrent users.
**Look for:** `import requests` in async code. `psycopg2` (sync) mixed with `asyncio`. `open()` for file reads in handlers. Sync `psycopg2.connect()` called from `async def save()`. `loop.run_in_executor()` as a band-aid (acceptable but flag it).
**Fix:** Use async equivalents (`aiohttp`, `asyncpg`, `aiofiles`) or `run_in_executor()` with bounded thread pool.

### 6. Unbounded Growth
**Pattern:** Lists, dicts, or caches that grow per-request and never get cleaned.
**Why it kills:** Memory leak. Service works for hours, then OOM-kills.
**Look for:** Module-level `_cache` dicts without TTL or max size. `_bulk_poster_cache` that grows forever. `bad_urls` sets. `dialog_data` dicts that accumulate entries. Global singletons (`_redis`, `_client`) that never close. Sets used for dedup that grow per-cycle.
**Fix:** Bound all collections. Use `TTLCache` or `LRUCache`. Clear state on navigation. Add `maxsize` to caches.

### 7. Error Recovery Gaps
**Pattern:** Errors handled at the wrong level — too deep (swallowed) or too shallow (crashes handler).
**Why it kills:** User sees "hanging" (error swallowed, no response) or generic error (unhandled exception).
**Look for:** `except Exception: pass` in handlers. Missing error replies to user. `callback.answer()` never called on error paths. Monitoring worker that catches and logs but doesn't retry or alert.
**Fix:** Every user-facing handler must either respond or propagate. No silent swallows. Workers must have dead-letter queues or alerts.

### 8. Concurrency & Race Conditions
**Pattern:** Shared mutable state accessed by concurrent coroutines without locks. Global semaphores created per-call instead of once. Check-then-act patterns across async boundaries.
**Why it kills:** Intermittent corruption. Semaphore limits bypassed. Duplicate sends. Data overwritten.
**Look for:** Global `_sem = None` initialized inside `_get_sem()` — if two coroutines call simultaneously before first assignment, two semaphores get created. `is_processed()` → `mark_processed()` gap where same URL processed twice. Watermark read-then-advance without DB-level locking. `nonlocal` counters modified in concurrent tasks.
**Fix:** Initialize semaphores at module level or use `asyncio.Lock` for lazy init. Use DB-level constraints (UNIQUE, SELECT FOR UPDATE) for critical-path dedup. Atomic operations where possible.

### 9. Stale Singleton / Module-Level State
**Pattern:** Module-level clients, routers, or connections that assume infrastructure is always available. Singletons that cache first-call state forever.
**Why it kills:** After infra restart (DB, Redis, LLM server), stale connection objects silently fail. Reconnect never happens because singleton already initialized.
**Look for:** `_json_router: Router | None = None` / `_redis: Redis | None = None` patterns without health checks or reconnection logic. `_get_conn()` that creates a new connection each time (no pool). Global `litellm.success_callback` that assumes process lifetime.
**Fix:** Use connection pools with built-in reconnection. Add health check before reuse. Consider factory patterns with TTL.

### 10. Time Bomb Defaults
**Pattern:** Hardcoded thresholds, credentials, rates, or URLs that were correct at deploy time but rot over time.
**Why it kills:** Exchange rates hardcoded (`USD_KGS_RATE = 87.5`). Price bounds computed once from historical data. Timeouts tuned for today's load. API endpoints that move.
**Look for:** Hardcoded exchange rates. `PRICE_BOUNDS` dictionaries with static log_mean/log_std. Timeout values that don't scale with workload. Fixed sleep intervals. Credentials in code.
**Fix:** Fetch rates dynamically with cache. Recompute statistical bounds periodically. Make timeouts proportional to batch size. Use env vars for credentials.

### 11. Partial Failure Amplification
**Pattern:** One failing item in a batch causes the entire batch to fail, or error handling that escalates minor issues into outages.
**Why it kills:** One bad listing crashes the entire country extraction. One blocked user makes monitoring worker skip all remaining monitors.
**Look for:** `asyncio.TaskGroup()` where one exception cancels all tasks (Python 3.11+ behavior). Sequential processing where one exception breaks the loop. `raise` inside batch loops. Error in callback that prevents watermark advance.
**Fix:** Use `asyncio.gather(return_exceptions=True)` or wrap each item in try/except. Advance watermarks even on partial failure. Isolate errors per-item.

### 12. SQL Injection & Query Safety
**Pattern:** String-interpolated SQL, f-strings in queries, unparameterized user input.
**Why it kills:** Data corruption or exfiltration. Silent until exploited.
**Look for:** `f"""SELECT ... WHERE phone = '{phone}'"""`. String formatting in SQL queries. `cur.execute(f"...")`. `.format()` with user-provided values in SQL strings. Even in "internal" code — data from LLM output or scraped content is untrusted.
**Fix:** Always use parameterized queries (`%s` placeholders with psycopg2, `:param` with SQLAlchemy). Never interpolate.

---

## How to Run

### Quick Audit (Single Directory)

```
Audit this directory for the 12 latent bug classes from the latent-bug-audit skill:
- <target_directory>

For each finding, report:
- File:line
- Bug class (1-12)
- What happens when it triggers
- Severity: P0 (outage) / P1 (data loss/corruption) / P2 (degraded) / P3 (cosmetic)
- Fix (one sentence)
```

### Full System Audit

```
Run a full latent bug audit across:

Parser hot path:
- simple_runner/extract.py
- simple_runner/db.py
- simple_runner/llm.py
- simple_runner/validation.py
- simple_runner/staleness.py
- simple_runner/progress.py

Bot hot path:
- bot/repositories/adsv3.py
- bot/monitoring_worker.py
- bot/shared/components/photos/photo_display_service.py
- bot/shared/components/formatters/ad_formatter.py
- bot/cache.py
- bot/dialogs/ad_browser/getters.py
- bot/dialogs/wizard/handlers.py

For each finding, report:
- File:line
- Bug class (1-12)
- What happens when it triggers
- Severity: P0/P1/P2/P3
- Fix (one sentence)

Then sort by severity and group by file.
```

### Post-Incident Audit

After an incident, focus the audit:

```
An incident occurred: <describe what happened>

Run a targeted latent bug audit. Focus on:
1. The exact code path that failed
2. All code paths that share the same pattern
3. Adjacent code that could fail the same way

Report findings with the standard format + "Could this have caused the incident?" column.
```

---

## Automated Detection Helpers

### Quick grep patterns (run before deep audit)

```bash
# Class 5: Blocking I/O in async
rg "import requests" --glob "*.py" -l | xargs rg "async def" -l 2>/dev/null
rg "psycopg2\.connect" --glob "*.py" -l | xargs rg "async def" -l 2>/dev/null

# Class 6: Unbounded caches
rg "_cache\s*[:=]\s*\{" --glob "*.py" | rg -v "TTLCache|LRUCache|maxsize"

# Class 8: Lazy semaphore init (race condition)
rg "Semaphore\(.*\)" --glob "*.py" -B2 | rg "if.*is None"

# Class 9: Stale singletons
rg "^_\w+\s*[:=]\s*None" --glob "*.py" | rg -v "^#"

# Class 10: Hardcoded rates/bounds
rg "RATE\s*=\s*\d" --glob "*.py"
rg "log_mean|log_std" --glob "*.py"

# Class 12: SQL injection
rg 'f""".*SELECT|f".*SELECT|\.format\(.*SELECT' --glob "*.py"
rg "f'.*WHERE|f\".*WHERE" --glob "*.py"
```

### Complexity check (high-complexity = likely bug harbor)

```bash
# Functions with cyclomatic complexity > 10
ruff check --select C901 --statistics .
# Or with radon
radon cc -s -n C -a simple_runner/ bot/
```

---

## Severity Classification

| Level | Meaning | Examples | Response |
|-------|---------|----------|----------|
| **P0** | Service outage | Event loop blocked, DB connection exhausted, OOM | Fix immediately |
| **P1** | Data loss/corruption | Silent data drops, SQL injection, wrong prices saved | Fix within 24h |
| **P2** | Degraded experience | Slow responses, missing fields, stale cache | Fix within sprint |
| **P3** | Cosmetic/tech debt | Suboptimal patterns, minor leaks | Backlog |

---

## Anti-Patterns by Layer

### Parser Layer (simple_runner/)

| Risk | Where | What to check |
|------|-------|---------------|
| Blocking DB in async | `db.py:save()` | `psycopg2.connect()` called from async — blocks event loop |
| Connection per save | `db.py:_get_conn()` | New connection each call, no pool |
| Lazy semaphore race | `extract.py:_get_driver_sem()` | Two coroutines can create two semaphores |
| Unbounded cache | `validation.py:_bulk_poster_cache` | Dict grows forever, no TTL/maxsize |
| SQL interpolation | `validation.py:is_bulk_poster()` | f-string in SQL `INTERVAL '{days} days'` |
| Stale price bounds | `validation.py:PRICE_BOUNDS` | Static dict, never refreshed |
| TaskGroup cancellation | `extract.py:extract_country()` | One exception cancels all tasks |

### Bot Layer (bot/)

| Risk | Where | What to check |
|------|-------|---------------|
| Sync Redis in async | `cache.py` | `time.sleep()` in retry backoff blocks event loop |
| Fallback cache unbounded | `cache.py:fallback_cache` | In-memory dict grows without limit |
| Sequential monitor processing | `monitoring_worker.py` | One slow send delays all monitors |
| Global backoff too aggressive | `monitoring_worker.py` | One user's flood control blocks ALL users |
| Missing pagination | `repositories/adsv3.py` | Large result sets loaded fully into memory |

---

## Historical Bugs Found by This Audit

| Date | Bug | Class | Impact |
|------|-----|-------|--------|
| 2026-02-16 | `_check_photo_url()` HEAD request per photo in getter | #1 Network I/O | 26s hang on 4th listing |
| 2026-02-16 | `Adsv3Listing.model_validate()` rejecting valid DB rows | #2 Silent Data Loss | Listings silently dropped |
| 2026-02-16 | `RICH_COLUMNS` missing `collage_file_id` | #3 Column Amnesia | Collages never shown |

---

## Checklist Format (for PR reviews)

```markdown
## Latent Bug Checklist
- [ ] No network I/O in hot paths (#1)
- [ ] No silent data loss in except blocks (#2)  
- [ ] No hardcoded column lists (#3)
- [ ] All connections use pools/context managers (#4)
- [ ] No blocking I/O in async functions (#5)
- [ ] All caches bounded (TTL or maxsize) (#6)
- [ ] All user-facing errors produce a response (#7)
- [ ] No shared mutable state without locks (#8)
- [ ] Singletons handle reconnection (#9)
- [ ] No hardcoded rates/thresholds that rot (#10)
- [ ] Batch failures are isolated per-item (#11)
- [ ] All SQL is parameterized (#12)
```
