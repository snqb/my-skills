---
name: swarm
description: "Parallel scraping/API work across multiple Railway workers. Each worker = unique IP. One project, N services, auto-teardown. Use for batch scraping, bulk API calls, or any task that benefits from multiple IPs."
---

# Swarm — Distributed Batch Workers on Railway

Spin up N parallel workers on Railway, each with a unique IP. One persistent project, services created/destroyed per job.

## When to Use

- Scraping sites that rate-limit per IP (Booking.com, Google, etc.)
- Bulk API calls where parallelism is limited per-IP
- Any batch job that takes >30min single-threaded

## Architecture

```
Local (orchestrator)
  ├── Creates N services in "swarm-pool" Railway project
  ├── Each service: same Dockerfile, different WORKER_ID + TASK_SLICE env vars
  ├── Workers pull their slice, process, write to /app/data/results.jsonl
  └── Orchestrator polls workers, collects results, tears down

Worker (Deno on Railway):
  1. Reads TASK_DATA env var (base64 gzipped JSONL) or downloads from TASK_URL
  2. Imports handler from HANDLER_URL (your custom scrape logic)
  3. Processes items with pooledMap(CONCURRENCY)
  4. Serves results on GET /results and GET /health
  5. Auto-exits when done
```

## Quick Start

```bash
# 1. Write your handler (one function that processes one item)
cat > /tmp/my-handler.ts << 'EOF'
export async function handle(item: any): Promise<any> {
  const resp = await fetch(`https://example.com/api/${item.id}`);
  return { id: item.id, status: "ok", data: await resp.json() };
}
EOF

# 2. Prepare items
echo '{"id":"abc"}' > /tmp/items.jsonl
echo '{"id":"def"}' >> /tmp/items.jsonl

# 3. Run swarm
deno run --allow-all ~/.pi/agent/skills/swarm/swarm.ts \
  --handler /tmp/my-handler.ts \
  --items /tmp/items.jsonl \
  --workers 5 \
  --output /tmp/results.jsonl
```

## Files

```
skills/swarm/
  SKILL.md          — this file
  swarm.ts          — orchestrator (creates workers, collects results)
  worker/
    Dockerfile      — generic worker image
    worker.ts       — task runner (Deno)
```

## How It Works

1. **First run**: creates Railway project "swarm-pool" (reused forever)
2. **Per job**: creates N services, each gets a slice of items via env vars
3. **Workers**: process items, serve results on HTTP
4. **Orchestrator**: polls worker URLs for results, streams to output file
5. **Teardown**: deletes services (not project) when done

## Config

| Env / Flag | Default | Description |
|------------|---------|-------------|
| `--workers N` | 5 | Number of parallel workers |
| `--concurrency N` | 3 | Concurrency per worker |
| `--handler PATH` | required | .ts file with `export async function handle(item)` |
| `--items PATH` | required | JSONL file with items to process |
| `--output PATH` | `/tmp/swarm-results.jsonl` | Output file |
| `RAILWAY_TOKEN` | from ~/.railway/config.json | Railway API token |

## Cost

- Railway Pro: $5/mo (already have)
- Per worker: ~$0.000463/min (512MB RAM)
- 10 workers × 30 min = ~$0.14
- Typical job (10K items, 10 workers): < $0.50

## Gotchas

- Railway rate-limits `serviceCreate`: 1 per 30s. Creating 10 workers takes ~5 min.
- Each service needs ~30s to build + deploy. Total startup: ~6 min for 10 workers.
- Max env var size: ~1MB. For large task lists, use TASK_URL (upload to server first).
- Services auto-sleep after 15 min idle. Workers should exit when done.
- **Don't forget teardown** — orphaned services cost money.
