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

## pi-llm — LLM Calls From Scripts

Any script can call pi's LLM (same auth.json, same models) for judgment or research steps:

```typescript
import { ask, run } from "~/.pi/agent/lib/pi-llm.ts";

const answer = await ask("Is this critical?", { model: "claude-haiku-4-5" });       // text→text, $0.001
const result = await run("Research X", { tools: "full", maxTurns: 8 });              // agent+tools, $0.05-0.30
// result.text, result.cost, result.turns, result.tools
```

Use when a script needs non-deterministic judgment at specific points. `ask()` for cheap yes/no, `run()` for agent that can bash/search/read.
