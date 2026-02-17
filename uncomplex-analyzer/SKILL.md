---
name: uncomplex-analyzer
description: Find complex code, analyze intent, recommend battle-tested library replacements. Uses radon/eslint for detection, GitHub quality search for alternatives.
---

# Uncomplex Analyzer

Detect complexity → understand intent → replace with libraries or simplify.

## Quick Run

```bash
# Python
radon cc <file_or_dir> -s --min C

# JS/TS
bunx eslint <file_or_dir> --rule 'complexity: [error, 15]' --format json
```

## Workflow

### 1. Detect (tools do the work)

**Cyclomatic complexity:**
```bash
# Python — install once: pip install radon
radon cc <directory> -s -j --min C | jq '.'
radon hal <file>   # Halstead: effort > 500 = hard to read

# JS/TS
bunx eslint <directory> --rule 'complexity: [error, 15]' --format json
```

**Circular dependencies:**
```bash
# Python — install once: pip install pydeps
pydeps <directory> --no-output --show-cycles

# JS/TS
bunx madge --circular <directory>
```

**Duplication:**
```bash
bunx jscpd . --threshold 5 --reporters console --ignore "**/*.json,**/*.md,**/*.lock,**/node_modules/**"
```

**Thresholds:** CC 15+ = review. CC 20+ = strong replacement candidate. CC 25+ = split or replace.

### 2. Analyze Intent

For each complex function, answer: **what is this trying to accomplish?** (not how)

Then check if someone already solved it:

| Code Pattern | Intent | Python | JS/TS |
|---|---|---|---|
| Manual base64 + HMAC | JWT auth | `pyjwt` | `jose` |
| Nested retry loops | Retry with backoff | `tenacity` | `p-retry` |
| Date string parsing | Date manipulation | `pendulum` | `dayjs` |
| Deep object merging | Object utilities | `deepmerge` | `lodash/merge` |
| Manual HTML parsing | Web scraping | `beautifulsoup4` | `cheerio` |
| Regex-heavy validation | Schema validation | `pydantic` | `zod` |
| Hand-rolled state machine | FSM / workflow | `transitions` | `xstate` |
| Manual CSV/Excel parsing | Tabular data | `pandas` | `papaparse` |
| Custom caching logic | Cache with TTL/LRU | `cachetools` | `lru-cache` |
| Manual rate limiting | Rate limiter | `ratelimit` | `bottleneck` |
| Hand-rolled queue | Task queue | `celery`, `rq` | `bull` |
| Custom logging format | Structured logging | `structlog` | `pino` |
| Subprocess orchestration | Task runner | `invoke` | `execa` |

If the pattern isn't in this table, search:

```bash
~/.pi/agent/skills/github-quality-search/github_search.py \
  "<intent keywords>" -l <language> -s 100 -n 3 --json
```

**Quality gates:** 100+ stars, MIT/Apache/BSD, commit in last 6 months, has docs.

### 3. Decide: Replace or Refactor?

**Replace** when the problem is generic (dates, HTTP, validation, parsing) and a quality library exists.

**Refactor** when logic is domain-specific or a library would be overkill. Keep it simple:
- God function → split into named helpers
- Deep nesting → guard clauses + early returns
- Copy-paste → extract shared function
- 5+ params → config object

**Leave alone** when:
- Low churn (stable, not causing bugs)
- Domain complexity (the problem IS complex)
- Intentional — comments explain why, perf-critical path, no-dependency policy

### 4. Report

Create `uncomplex-report-YYYYMMDD.md` with:
- Summary stats (files scanned, high-complexity count)
- Each finding: location, complexity score, intent, recommendation (library or refactoring)
- Library replacements table (name, stars, license, migration effort)
- Top 3 priorities

## Cross-References

- Prioritize targets: `hotspot-detective` (high churn + high complexity = act first)
- Clean up after: `dead-code-reaper`
- Library discovery: `github-quality-search`

**Combo:** `hotspot-detective` → `uncomplex-analyzer` → `dead-code-reaper`

## Dependencies

```bash
pip install radon pydeps          # Python
# JS/TS: bunx eslint, bunx jscpd, bunx madge (zero-install)
```
