---
name: longrun
description: "Async concurrent scripts that stream results to disk and run in tmux. Use for any batch/bulk work: API calls, scraping, file processing, data transforms — anything that processes a list of items or takes >10s."
---

# longrun

Write scripts that are **concurrent inside**, **streaming out**, and **async from conversation** (tmux).

**Trigger**: About to write a script that loops over items, calls APIs, processes files, or will take >10s.

## The Pattern

### 1. Script Structure (Python default)

```python
#!/usr/bin/env python3
"""One-line description of what this does."""
import asyncio, aiohttp, json, sys
from pathlib import Path

CONCURRENCY = 10
OUTPUT = Path("/tmp/TASKNAME.jsonl")

async def process(session, sem, item):
    async with sem:
        try:
            # ... actual work ...
            return {"item": item, "status": "ok", "data": result}
        except Exception as e:
            return {"item": item, "status": "error", "error": str(e)}

async def main():
    # Resume support: skip already-processed items
    done = set()
    if OUTPUT.exists():
        for line in OUTPUT.read_text().splitlines():
            done.add(json.loads(line)["item"])

    items = [i for i in ALL_ITEMS if i not in done]
    if not items:
        print("All done.", file=sys.stderr)
        return

    print(f"Processing {len(items)} items ({len(done)} already done)", file=sys.stderr)

    sem = asyncio.Semaphore(CONCURRENCY)
    async with aiohttp.ClientSession() as session:
        tasks = [process(session, sem, item) for item in items]
        with OUTPUT.open("a") as f:  # append mode for resume
            for coro in asyncio.as_completed(tasks):
                result = await coro
                line = json.dumps(result, ensure_ascii=False)
                f.write(line + "\n")
                f.flush()
                # Also print to stdout for tmux capture visibility
                print(line, flush=True)

if __name__ == "__main__":
    asyncio.run(main())
```

### 2. Run in tmux

```bash
tmux has-session -t pi 2>/dev/null || tmux new-session -d -s pi
tmux new-window -d -t pi -n TASKNAME 'python /tmp/TASKNAME.py'
```

### 3. Monitor

```bash
# Progress count
wc -l /tmp/TASKNAME.jsonl

# Last few results
tail -3 /tmp/TASKNAME.jsonl | jq .

# Error count
grep -c '"status": "error"' /tmp/TASKNAME.jsonl

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
- **Always `flush=True`** — results must hit disk immediately.
- **Always append mode** — enables resume after crash.
- **Always `try/except` per item** — one failure must not kill the batch.
- **Semaphore for concurrency** — don't blast APIs. Start with 10, adjust.
- **Status field in every result** — `"ok"` or `"error"`, makes filtering trivial.
- **Progress to stderr** — counts, summaries, warnings go to stderr. Data goes to stdout/file.
- **Output to `/tmp/`** — disposable. Move to `.git/reports/` if worth keeping.

## Variations

### Simple (no async needed)
For CPU-bound or sequential work, same pattern without asyncio:

```python
for item in items:
    result = process(item)
    print(json.dumps(result), flush=True)
```

### Node.js
```javascript
import pLimit from 'p-limit';
const limit = pLimit(10);
const tasks = items.map(item => limit(() => process(item)));
for (const promise of tasks) {
    const result = await promise;
    process.stdout.write(JSON.stringify(result) + '\n');
}
```

### Bash (curl-based)
```bash
while IFS= read -r url; do
    curl -s "$url" | jq -c '{url: $url, status: .status}' --arg url "$url"
done < urls.txt | tee /tmp/results.jsonl
```

## Anti-patterns (DON'T)

- ❌ Accumulate results in a list, dump at the end
- ❌ Run inline and block the conversation
- ❌ No error handling per item
- ❌ No flush — buffered output defeats the purpose
- ❌ CSV/custom formats — jsonl is universal
- ❌ Overwrite mode — kills resume capability
