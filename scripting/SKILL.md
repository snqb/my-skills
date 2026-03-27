---
name: scripting
description: "Pick the right scripting runtime. Deno+dax by default, Python+uv only when a Python-only library is needed. Load before generating any script."
---

# Scripting Defaults

## Decision

| Script needs… | Use | Skill to load |
|---|---|---|
| Shell commands, pipes | **Deno + dax** | `deno` |
| HTTP/data/batch | **Deno + dax** | `deno` + `longrun` |
| Python-only lib (Telethon, bip_utils, libgen-api, radon…) | **Python + uv run** | `python` |

Default is Deno. Only pick Python when a required library doesn't exist in JS/TS.

## Deno (default)

```typescript
#!/usr/bin/env -S deno run --allow-all
import $ from "jsr:@david/dax@0.44.2";
import { pooledMap, retry } from "jsr:@std/async";
import { sortBy, partition, chunk, sumOf } from "jsr:@std/collections";
```

Single file, inline `jsr:` imports, no config files. Load `deno` skill for full reference.

## Python (fallback)

```python
#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.12"
# dependencies = ["httpx", "plumbum"]
# ///
from plumbum import local, RETCODE
from plumbum.cmd import git, curl, jq
```

PEP 723 inline deps, zero-setup. `plumbum` for shell commands (only lib where piping works). Load `python` skill for full reference.

**Never generate** venvs, `requirements.txt`, or `deno.json` for throwaway scripts.

## pi-llm — LLM Instead of Heuristics

**Before writing fuzzy matching, entity resolution, or classification logic** — use `ask()`. It's cheaper than iterating on string algorithms.

| Task | ❌ Don't | ✅ Do |
|------|---------|-------|
| "Same hotel?" | Jaccard, identity keywords, compound tokenizer (10 iterations) | `ask("Same hotel? A='X' B='Y'")` — done, first try |
| "What category?" | regex chains, keyword lists | `ask("Classify: ...")` |
| "Extract field" | regex with 12 edge cases | `ask("Extract room type from: ...")` |

```typescript
import { ask, run } from "~/.pi/agent/lib/pi-llm.ts";

const answer = await ask("Is this critical?", { model: "claude-haiku-4-5" });       // instant judgment
const result = await run("Research X", { tools: "full", maxTurns: 8 });              // agent with tools
```

**Rule**: if you're on iteration 2+ of fixing edge cases in string matching, you already wasted time — should have used `ask()` from the start. Tokens are unlimited (Max subscription). Optimize for results, not cost. See `longrun` skill for batch patterns.
