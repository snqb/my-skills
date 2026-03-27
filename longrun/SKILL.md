---
name: longrun
description: "Async concurrent scripts that stream results to disk and run in tmux. Use for any batch/bulk work: API calls, scraping, file processing, data transforms — anything that processes a list of items or takes >10s."
---

# longrun

Write scripts that are **concurrent inside**, **streaming out**, and **async from conversation** (tmux).

**Trigger**: About to write a script that loops over items, calls APIs, processes files, or will take >10s.

## The Pattern

### 1. Script Structure (Deno + dax + std)

```typescript
#!/usr/bin/env -S deno run --allow-all
/** One-line description of what this does. */
import $ from "jsr:@david/dax@0.44.2";
import { pooledMap } from "jsr:@std/async";

const CONCURRENCY = 10;
const OUTPUT = "/tmp/TASKNAME.jsonl";

type Result = { item: string; status: "ok" | "error"; data?: unknown; error?: string };

async function process(item: string): Promise<Result> {
  try {
    const resp = await fetch(`https://api.example.com/${item}`);
    const data = await resp.json();
    return { item, status: "ok", data };
  } catch (e) {
    return { item, status: "error", error: String(e) };
  }
}

// Resume: skip already-processed items
const done = new Set<string>();
try {
  for (const line of (await Deno.readTextFile(OUTPUT)).split("\n").filter(Boolean)) {
    done.add(JSON.parse(line).item);
  }
} catch { /* file doesn't exist yet */ }

const items = ALL_ITEMS.filter((i) => !done.has(i));
if (!items.length) { console.error("All done."); Deno.exit(0); }
console.error(`Processing ${items.length} items (${done.size} already done)`);

// Concurrent pool → stream to disk
const file = await Deno.open(OUTPUT, { append: true, create: true });
const enc = new TextEncoder();

for await (const result of pooledMap(CONCURRENCY, items, process)) {
  const line = JSON.stringify(result);
  file.writeSync(enc.encode(line + "\n"));
  console.log(line);
}

file.close();
```

### 2. Run in tmux

```bash
tmux has-session -t pi 2>/dev/null || tmux new-session -d -s pi
tmux new-window -d -t pi -n TASKNAME 'deno run --allow-all /tmp/TASKNAME.ts'
```

### 3. Monitor

```bash
# Progress count
wc -l /tmp/TASKNAME.jsonl

# Last few results
tail -3 /tmp/TASKNAME.jsonl | jq .

# Error count
grep -c '"status":"error"' /tmp/TASKNAME.jsonl

# Sanity check first result
head -1 /tmp/TASKNAME.jsonl | jq .

# Live follow
tmux capture-pane -t pi:TASKNAME -p -S -10
```

### 4. Cleanup

```bash
tmux kill-window -t pi:TASKNAME 2>/dev/null
```

## Key Rules

- **Always `.jsonl`** — one JSON object per line. Parseable, appendable, streamable.
- **Always `writeSync`** — results hit disk immediately. No buffering.
- **Always append mode** — enables resume after crash.
- **Always `try/catch` per item** — one failure must not kill the batch.
- **`pooledMap` for concurrency** — don't blast APIs. Start with 10, adjust.
- **Status field in every result** — `"ok"` or `"error"`, makes filtering trivial.
- **Progress to stderr** — counts, summaries, warnings go to stderr. Data goes to stdout/file.
- **Output to `/tmp/`** — disposable. Move to `.git/reports/` if worth keeping.
- **File extension `.ts`** — all scripts are TypeScript, run with `deno run --allow-all`.

## Variations

### Simple (no concurrency needed)

```typescript
#!/usr/bin/env -S deno run --allow-all
for (const item of items) {
  const result = await process(item);
  console.log(JSON.stringify(result));
}
```

### Shell commands with dax

```typescript
#!/usr/bin/env -S deno run --allow-all
import $ from "jsr:@david/dax@0.44.2";
import { pooledMap } from "jsr:@std/async";

for await (const result of pooledMap(5, files, async (file) => {
  const output = await $`ffprobe -v quiet -print_format json -show_format ${file}`.json();
  return { file, status: "ok", data: output };
})) {
  console.log(JSON.stringify(result));
}
```

### Fetch with retry

```typescript
#!/usr/bin/env -S deno run --allow-all
import { pooledMap, retry } from "jsr:@std/async";

for await (const result of pooledMap(5, urls, async (url) => {
  const data = await retry(async () => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  }, { maxAttempts: 3, minTimeout: 1000 });
  return { url, status: "ok", data };
})) {
  console.log(JSON.stringify(result));
}
```

## LLM vs Algorithm — Decision Point

**Before writing fuzzy matching, scoring functions, or multi-iteration string comparison — STOP.**

These tasks are **judgment**, not computation. Use `ask()`:
- **Entity matching**: "Is hotel A the same as hotel B?" — $0.001, 100% accuracy
- **Classification**: "Is this review positive?" — cheaper than sentiment libraries
- **Extraction**: "Extract the room type from this string" — no regex needed
- **Validation**: "Does this result make sense?" — catches edge cases you'd never code for

**Tokens are unlimited** (Max subscription). Don't optimize for cost — optimize for result quality. Writing 10 iterations of fuzzy matching = hours wasted + bugs + false matches. `ask()` gets it right first time.

**Rule of thumb**: if you're on iteration 2+ of fixing edge cases in string matching, you already wasted time — should have used `ask()` from the start.

### When NOT to use LLM
- Exact lookups, numeric comparisons, deterministic transforms — code is faster
- Real-time hot paths — `ask()` adds 200-500ms per call

## pi-llm for Smart Batch Jobs

```typescript
import { ask, run } from "~/.pi/agent/lib/pi-llm.ts";

// Judgment per item — cheap and accurate
for (const item of remaining) {
  const match = await ask(
    `Is "${item.nameA}" the same entity as "${item.nameB}"? ` +
    `Context: ${item.city}, ${item.country}. Answer: yes/no`,
    { model: "claude-haiku-4-5" }  // $0.001/call
  );
  // ...
}

// Research per item — when agent needs tools
for (const item of remaining) {
  const result = await run(`Research ${item.name}`, { tools: "full", maxTurns: 8 });
  file.writeSync(enc.encode(JSON.stringify({ id: item.id, text: result.text, cost: result.cost }) + "\n"));
}
```

`ask()` = text→text, no tools, instant. `run()` = bounded agent with bash/search/read. Tokens are unlimited — use freely.

## Anti-patterns (DON'T)

- ❌ Accumulate results in a list, dump at the end
- ❌ Run inline and block the conversation
- ❌ No error handling per item
- ❌ No flush — buffered output defeats the purpose
- ❌ CSV/custom formats — jsonl is universal
- ❌ Overwrite mode — kills resume capability
- ❌ Manual semaphore spin-wait — use `pooledMap`
- ❌ Writing fuzzy matching / scoring algorithms for entity resolution — use `ask()` for judgment
- ❌ Iterating on string heuristics (identity keywords, compound tokenizers, etc.) — if iteration 2+ of edge case fixes, switch to LLM
