---
name: one-shot
description: "Ship a working product in one pi session. Gate check → research → spec → build (logic separated from transport) → test → deploy. Empirical patterns from 60+ projects. Load when starting anything new."
---

# One-Shot

## Gate Check (do this FIRST, before anything)

From your history — what one-shots vs. what spirals:

**Shipped in 1–2 sessions:** apihue (315 LOC), valuta (159 LOC), teplee (spec.md → Fresh → deploy), botetimologiy (9 commits). All: single-file, one data source, one deploy target.

**Spiraled into 10–92 sessions:** krugosvet (92 sessions), domcom-parser (153), ollolingo (has LESSONS_LEARNED.md). All: multiple components, scraping complexity, ambitious scope.

**The rule:** If you can't describe what the service does in one sentence and the entire codebase in <500 LOC — it's not one-shot. Split into phases.

Kill signals — any of these means NOT one-shot:
- Data source needs business registration / approval / OAuth dance
- Data behind login wall, CAPTCHA, or Chinese firewall
- Needs >1 service (frontend + backend + bot)
- You're estimating >1000 LOC
- Undocumented or Chinese-only dependencies

When the idea is too big, **scope knife** to Phase 1:
- "AliExpress + Pinduoduo + 1688 bot" → "AliExpress-only bot (has API)"
- "Language learning app" → "Quiz bot with 50 hardcoded questions"
- "Tour platform" → "Single page showing hot tours from API"

---

## Research (never skip)

The graveyard of failed one-shots: projects where the data source didn't work.

**Verify the data source with a throwaway script BEFORE writing spec.md:**

```bash
# Test API actually returns data
deno eval "const r = await fetch('https://api.example.com/search?q=test'); console.log(r.status, await r.text().then(t=>t.slice(0,500)))"
```

GitHub landscape check:
```bash
curl -s "https://api.github.com/search/repositories?q=KEYWORDS&sort=stars&per_page=10" | \
  python3 -c "import json,sys; [print(f'⭐{r[\"stargazers_count\"]:>5} | {r[\"full_name\"]:<45} | {r[\"description\"][:70]}') for r in json.load(sys.stdin).get('items',[])]"
```
- ⭐100+ active → depend on it
- ⭐10-100 → read code for patterns
- nothing → you're innovating or the idea has a hidden wall

Use `context7` skill for fast-moving libraries (aiogram, Hono, etc.) — training data is stale.

---

## spec.md (one screen, non-negotiable)

Every successful one-shot (teplee, oval) had one. Every spiral (ollolingo) had an ambitious multi-page plan.

```markdown
# PROJECT — one-line description

## What
- User does X → gets Y (2-3 bullets max)

## Data
- Source: [API name] — [docs link]
- Auth: key / none
- Verified: yes (tested in research phase)

## Stack
- [Deno+Hono / Python+aiogram / Fresh]
- SQLite / none
- Railway

## Files
- main.ts — entry + handlers
- lib.ts — business logic (ZERO framework imports)
- Dockerfile

## Not Now
- Things explicitly deferred to Phase 2
```

If spec doesn't fit one screen → scope is too big.

---

## Build: Logic ≠ Transport

This is the core insight. Your most testable bot (medbot: 3108 LOC, eval harness, 8.4/10 validated) separates cleanly:

```
lib.py / tools.py          →  pure async functions, no framework imports
agent.py                   →  orchestration, prompt, conversation state
main.py                    →  thin aiogram/Hono wrapper, calls lib functions
```

**For bots — why they fail:** logic mixed with `@router.message` handlers → can't test without Telegram → manual clicking → slow → multi-session.

**The fix:**
```python
# lib.py — testable without Telegram
async def search_products(query: str) -> list[dict]:
    """Takes string, returns data. That's it."""
    async with httpx.AsyncClient() as c:
        r = await c.get("https://api.example.com/search", params={"q": query})
        return r.json()["items"]

# main.py — thin adapter, minimal logic
@router.message(F.text)
async def handle(msg: Message):
    results = await search_products(msg.text)
    await msg.answer(format_results(results))
```

For Deno microservices — your apihue/valuta pattern: everything in single main.ts for <500 LOC.

For web — ABP browser testing loop during build:
```bash
B=~/.pi/agent/skills/browser-testing/browser.js
$B start && $B nav http://localhost:3000
$B screenshot && $B observe
$B click 400 300 && $B assert text "Expected"
```

---

## Test: Three Levels

### 1. Smoke test (always, takes 2 minutes)

```bash
#!/usr/bin/env -S deno run --allow-all
// smoke.ts — verify all API calls work before deploying
const results = await searchProducts("test");
console.assert(results.length > 0, "has results");
console.assert(results[0].price > 0, "has price");
console.log("✅ passed");
```

For Python: `uv run python -c "import asyncio; from lib import search_products; print(asyncio.run(search_products('test')))"`

### 2. Telethon E2E (for bots — the missing piece)

Automated end-to-end: send real messages to bot, check real responses. Uses your pre-authenticated session.

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["telethon"]
# ///
"""E2E bot test via Telethon. Sends messages, checks responses."""

import asyncio, shutil, os
from telethon import TelegramClient

API_ID = int(os.popen("pass telegram/me/api_id").read().strip())
API_HASH = os.popen("pass telegram/me/api_hash").read().strip()
BOT_USERNAME = "@your_bot"  # ← change this
SESSION = "/tmp/test_e2e.session"

# Copy session to avoid lock conflicts
shutil.copy("/Users/sn/.pi/telegram_sessions/default.session", SESSION)

async def test():
    async with TelegramClient(SESSION, API_ID, API_HASH) as client:
        # Test /start
        await client.send_message(BOT_USERNAME, "/start")
        await asyncio.sleep(3)
        msgs = await client.get_messages(BOT_USERNAME, limit=1)
        assert msgs[0].text, "/start returned empty"
        print(f"✅ /start → {msgs[0].text[:80]}")

        # Test search
        await client.send_message(BOT_USERNAME, "bluetooth headphones")
        await asyncio.sleep(5)
        msgs = await client.get_messages(BOT_USERNAME, limit=1)
        assert "headphone" in msgs[0].text.lower() or msgs[0].media, "search returned nothing useful"
        print(f"✅ search → {msgs[0].text[:80] if msgs[0].text else '[media]'}")

asyncio.run(test())
os.remove(SESSION)
print("🎉 All E2E tests passed")
```

Run in tmux: `tmux send-keys -t pi "uv run test_e2e.py" Enter`

### 3. Eval harness (for AI/LLM bots — the medbot pattern)

Portable skeleton from medbot. Three LLM roles: simulated user, your bot's prompt, judge.

```
eval/
├── scenarios.jsonl      # {"id":"x","persona":"35M","complaint":"...","expect":["ask_X","suggest_Y"]}
├── prompts.ts           # system prompts for bot, simulated user, judge
├── llm.ts               # pi-llm wrapper (shell out to node for pi-llm.mjs)
├── run-eval.ts          # loop: user↔bot for N turns, then judge scores 6 axes
└── results/             # conversations.jsonl — resumable, append-mode
```

Core loop (from medbot/eval/run-eval.ts):
```
for each scenario:
  patient = LLM(patient_system_prompt + scenario)
  for MAX_TURNS:
    patient_msg = ask(patient_context)
    doctor_msg  = ask(doctor_system_prompt + conversation_so_far)
  scores = ask(judge_prompt + conversation + expected_behavior)
  append to results.jsonl
```

Judge scores: accuracy, safety, completeness, conciseness, empathy, actionability. Returns JSON.

**The eval is more valuable than the bot.** It lets you iterate the prompt with confidence. Build it even if it takes 30 minutes — it saves hours of manual testing.

---

## Deploy

Bot: polling mode for MVP (simpler than webhooks). `railway up` with `BOT_TOKEN` in env.

Everything else: Dockerfile + Railway. You know the drill.

Bot-specific gotchas:
- Polling = simpler, works immediately. Webhook = needs public URL + `secret_token`.
- `/health` endpoint even on bots — Railway needs it.
- Start bot in tmux locally first, test, THEN deploy.

---

## Checklists

### Telegram Bot
- [ ] Data source verified with test script
- [ ] spec.md (one screen)
- [ ] lib.py with zero framework imports, tested standalone
- [ ] main.py: thin aiogram wrapper
- [ ] Smoke test passes
- [ ] Telethon E2E passes (if applicable)
- [ ] Eval harness passes (if LLM bot)
- [ ] Deployed, /start works

### Web App
- [ ] Data source verified
- [ ] spec.md (one screen)
- [ ] Built with ABP screenshot→fix loop
- [ ] Mobile viewport check
- [ ] Deployed, ABP screenshot of production URL

### Microservice
- [ ] Data source verified
- [ ] Single main.ts, <500 LOC
- [ ] /health endpoint
- [ ] Tests pass
- [ ] Deployed, curl health passes
