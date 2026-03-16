---
name: deno
description: "Deno + dax scripting: single-file TypeScript scripts with safe shell commands, std library FP, concurrency, streams. Use when generating any script, batch job, or CLI tool."
---

# Deno Scripting

TypeScript single-file scripts with dax (shell), std (FP/collections/async), and zero setup.

**Default runtime for all generated scripts.** Replaces bash scripts and Python one-offs.

## Hashbang

Every script starts with:

```typescript
#!/usr/bin/env -S deno run --allow-all
```

Then `chmod +x script.ts` and run `./script.ts`. No deno.json, no package.json, no install step.

## Imports (inline jsr: for scripts)

Single-file scripts use inline `jsr:` specifiers — no deno.json needed:

```typescript
import $ from "jsr:@david/dax@0.44.2";
import { pooledMap, retry, delay } from "jsr:@std/async";
import { sortBy, chunk, partition, sumOf } from "jsr:@std/collections";
import { TextLineStream } from "jsr:@std/streams";
import { walk, ensureDir, exists } from "jsr:@std/fs";
import { join, basename, extname } from "jsr:@std/path";
import { parseArgs } from "jsr:@std/cli";
import { parse as parseCsv } from "jsr:@std/csv";
```

Cached after first run. Subsequent runs are instant.

## dax — Shell Commands

Safe command execution. Tagged templates keep args as arrays (no shell injection):

```typescript
import $ from "jsr:@david/dax@0.44.2";

// Run and get output
const text = await $`echo hello`.text();
const json = await $`curl -s https://api.example.com/data`.json();
const lines = await $`git log --oneline -10`.lines();

// Interpolation is safe (no shell expansion)
const dir = "path with spaces";
await $`ls ${dir}`;

// Ignore exit code
await $`grep pattern file.txt`.noThrow();

// Pipe
await $`cat data.txt`.pipe($`grep pattern`).pipe($`wc -l`);

// Spawn (don't await, get handle)
const proc = $`sleep 10`.spawn();
proc.kill();

// Sleep
await $.sleep("2s");

// Retry
await $.withRetries({ count: 3, delay: "1s" }, async () => {
  await $`curl -f https://flaky.api/endpoint`;
});
```

### $.path — File Operations (Fluent API)

```typescript
const p = $.path("/tmp/output");

// Read/write
const text = await p.join("file.txt").readText();
await p.join("out.json").writeJson({ ok: true });
await p.join("log.jsonl").appendText(line + "\n");

// Check
if (await p.exists()) { ... }
if (p.isFileSync()) { ... }

// Dir operations
await p.ensureDir();
await p.emptyDir();
for (const entry of p.readDirSync()) { ... }

// Copy/move/remove
await p.join("a.txt").copyFile(p.join("b.txt"));
await p.join("old").rename(p.join("new"));
await p.remove();
```

## @std/collections — FP Toolkit

All pure functions, no mutation:

```typescript
import {
  sortBy, chunk, partition, distinct, distinctBy,
  sumOf, maxBy, minBy, mapValues, filterEntries,
  associateBy, pick, omit, zip, intersect, union, withoutAll,
  groupBy,  // Note: not exported — use manual group below
} from "jsr:@std/collections";

const items = [
  { name: "a", score: 10, tag: "x" },
  { name: "b", score: 30, tag: "y" },
  { name: "c", score: 20, tag: "x" },
];

// Sort, filter, split
sortBy(items, (i) => i.score);                    // → [{a,10}, {c,20}, {b,30}]
partition(items, (i) => i.score > 15);             // → [[{b,30},{c,20}], [{a,10}]]
distinct([1, 2, 2, 3]);                            // → [1, 2, 3]
distinctBy(items, (i) => i.tag);                   // → [{a,"x"}, {b,"y"}]

// Aggregate
sumOf(items, (i) => i.score);                      // → 60
maxBy(items, (i) => i.score);                      // → {b, 30}
minBy(items, (i) => i.score);                      // → {a, 10}

// Batch
chunk(items, 2);                                   // → [[a,b], [c]]

// Objects
pick({ a: 1, b: 2, c: 3 }, ["a", "c"]);           // → {a:1, c:3}
omit({ a: 1, b: 2, c: 3 }, ["b"]);                // → {a:1, c:3}
mapValues({ x: [1,2], y: [3] }, (v) => v.length);  // → {x:2, y:1}
filterEntries({ a: 1, b: 0 }, ([_, v]) => v > 0);  // → {a:1}

// Set ops
intersect([1,2,3], [2,3,4]);                       // → [2,3]
union([1,2], [2,3]);                               // → [1,2,3]
withoutAll([1,2,3], [2]);                          // → [1,3]
zip([1,2], ["a","b"]);                             // → [[1,"a"],[2,"b"]]

// Group (manual — groupBy not in std)
const grouped: Record<string, typeof items> = {};
for (const i of items) (grouped[i.tag] ??= []).push(i);
// then: mapValues(grouped, (v) => sumOf(v, (i) => i.score))
```

## @std/async — Concurrency

```typescript
import { pooledMap, retry, delay, deadline, debounce } from "jsr:@std/async";

// pooledMap: concurrent map with pool limit, streams results
for await (const result of pooledMap(10, items, async (item) => {
  const resp = await fetch(`https://api.example.com/${item}`);
  return resp.json();
})) {
  console.log(result);
}

// retry: exponential backoff
const data = await retry(async () => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}, { maxAttempts: 5, minTimeout: 1000, multiplier: 2 });

// delay
await delay(1000);

// deadline: timeout
const result = await deadline(fetch(url), 5000);

// debounce
const save = debounce((text: string) => {
  Deno.writeTextFileSync("/tmp/draft.txt", text);
}, 300);
```

## @std/streams — Line-by-Line Processing

```typescript
import { TextLineStream } from "jsr:@std/streams";

// Read file as stream of lines
const file = await Deno.open("data.jsonl");
for await (const line of file.readable
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TextLineStream())) {
  if (line) console.log(JSON.parse(line));
}

// Process command output as stream
const proc = new Deno.Command("tail", { args: ["-f", "/var/log/system.log"], stdout: "piped" }).spawn();
for await (const line of proc.stdout
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TextLineStream())) {
  console.log(line);
}
```

## @std/fs — File System

```typescript
import { walk, ensureDir, exists, expandGlob } from "jsr:@std/fs";

await ensureDir("/tmp/output");

// Walk directory tree
for await (const entry of walk("./src", { exts: [".ts"], skip: [/node_modules/] })) {
  console.log(entry.path);
}

// Glob
for await (const entry of expandGlob("**/*.jsonl")) {
  console.log(entry.path);
}

if (await exists("/tmp/cache.json")) { ... }
```

## @std/cli — Argument Parsing

```typescript
import { parseArgs } from "jsr:@std/cli";

const args = parseArgs(Deno.args, {
  string: ["output", "format"],
  boolean: ["verbose", "dry-run"],
  default: { output: "/tmp/out.jsonl", format: "json" },
  alias: { o: "output", v: "verbose" },
});

// args.output, args.verbose, args["dry-run"], args._ (positional)
```

## Other Useful std Modules

```typescript
// CSV
import { parse, stringify } from "jsr:@std/csv";
const records = parse(csvText, { skipFirstRow: true });

// Encoding
import { encodeBase64, decodeBase64 } from "jsr:@std/encoding";

// Text
import { toCamelCase, toSnakeCase, levenshteinDistance } from "jsr:@std/text";

// Datetime
import { format } from "jsr:@std/datetime";

// YAML/TOML/JSON
import { parse as parseYaml } from "jsr:@std/yaml";
import { parse as parseToml } from "jsr:@std/toml";
import { parse as parseJsonc } from "jsr:@std/jsonc";
```

## Patterns

### JSONL Streaming (append + flush)

```typescript
const file = await Deno.open(OUTPUT, { append: true, create: true });
const enc = new TextEncoder();

function writeLine(obj: unknown) {
  const line = JSON.stringify(obj) + "\n";
  file.writeSync(enc.encode(line));  // sync = immediate flush
  console.log(line.trimEnd());
}
```

### Resume Support

```typescript
const done = new Set<string>();
try {
  for (const line of (await Deno.readTextFile(OUTPUT)).split("\n").filter(Boolean)) {
    done.add(JSON.parse(line).item);
  }
} catch { /* file doesn't exist yet */ }
const remaining = items.filter((i) => !done.has(i));
```

### Concurrent HTTP + Streaming to Disk

```typescript
import { pooledMap } from "jsr:@std/async";

const file = await Deno.open(OUTPUT, { append: true, create: true });
const enc = new TextEncoder();

for await (const result of pooledMap(10, items, async (item) => {
  try {
    const data = await (await fetch(`${API}/${item}`)).json();
    return { item, status: "ok" as const, data };
  } catch (e) {
    return { item, status: "error" as const, error: String(e) };
  }
})) {
  const line = JSON.stringify(result) + "\n";
  file.writeSync(enc.encode(line));
  console.log(line.trimEnd());
}
file.close();
```

### Promise.all for Independent Tasks

```typescript
import $ from "jsr:@david/dax@0.44.2";

await Promise.all([
  $`rsync -az ./src server1:~/project/`,
  $`rsync -az ./src server2:~/project/`,
  $`rsync -az ./src server3:~/project/`,
]);
```

### Fetch with Typed Response

```typescript
interface ApiResponse { items: { id: string; name: string }[] }

const data: ApiResponse = await (await fetch(url)).json();
```

## Built-in Deno APIs (no import needed)

```typescript
// File I/O
await Deno.readTextFile("input.txt");
await Deno.writeTextFile("output.txt", content);
const file = await Deno.open(path, { read: true, write: true, append: true, create: true });

// Env
Deno.env.get("API_KEY");

// Exit
Deno.exit(1);

// Args
Deno.args;  // string[]

// Temp files
const tmp = await Deno.makeTempFile({ suffix: ".json" });

// Run subprocess (low-level — prefer dax)
const cmd = new Deno.Command("git", { args: ["status"], stdout: "piped" });
const { stdout } = await cmd.output();
new TextDecoder().decode(stdout);
```

## pi-llm — LLM Calls From Scripts

Scripts can call pi's own LLM (same auth, same models) for judgment, research, or writing steps mid-pipeline:

```typescript
import { ask, run } from "~/.pi/agent/lib/pi-llm.ts";

// Text in, text out. No tools. Cheap.
const answer = await ask("Is this log healthy?\n" + logText, { model: "claude-haiku-4-5" });

// Bounded agent with full pi stack (bash, read, search, skills).
const result = await run("Research this person and find 5 facts", {
  tools: "full",      // "full" | "coding" | "readonly" | "none"
  maxTurns: 8,
  model: "claude-sonnet-4-5",
  cwd: "/project/dir",
  onTool: (name, input) => console.log(`  ⚡ ${name}`),
});
// result.text, result.cost, result.turns, result.tools
```

| Primitive | What | Default model | Typical cost |
|-----------|------|---------------|-------------|
| `ask(prompt, opts?)` | Text in/out, no tools | Sonnet 4.5 | $0.001-0.02 |
| `run(prompt, opts?)` | Bounded agent with tools | Sonnet 4.5 | $0.05-0.30 |

`tools: "full"` gives the agent all 70+ pi skills (serper-search, exa-search, pass, etc.) + bash/read/edit/write + interactive_shell + subagent.

Use `ask()` for cheap judgment. Use `run()` when the agent needs to act (curl, read files, search).

## Anti-Patterns

- ❌ `deno.land/x/` imports — deprecated. Use `jsr:` or `npm:`.
- ❌ `deps.ts` pattern — outdated. Inline `jsr:` imports for scripts.
- ❌ Manual semaphore spin-wait — use `pooledMap` from `@std/async`.
- ❌ `npm:node-fetch` — Deno has native `fetch`.
- ❌ `npm:fs-extra` — use `@std/fs` or `$.path()`.
- ❌ `any` types — define interfaces or use `unknown` + narrowing.
- ❌ Forgetting `--allow-all` in hashbang for scripts (use fine-grained perms only in production).
