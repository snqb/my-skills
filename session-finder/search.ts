#!/usr/bin/env -S deno run --allow-all
/** Smart session search across pi session history. */
import $ from "jsr:@david/dax@0.44.2";
import { parseArgs } from "jsr:@std/cli";
import { walk } from "jsr:@std/fs";
import { basename, dirname } from "jsr:@std/path";

const SESSIONS_DIR = Deno.env.get("PI_CODING_AGENT_DIR") ?? `${Deno.env.get("HOME")}/.pi/agent`;
const DIR = `${SESSIONS_DIR}/sessions`;

const args = parseArgs(Deno.args, {
  string: ["recent", "project", "export"],
  boolean: ["list", "help"],
  alias: { h: "help", n: "recent", p: "project" },
});

if (args.help || args._.length === 0) {
  console.log(`Usage: search.ts <term1> [term2] [options]

Options:
  --recent N      Only last N days
  --project NAME  Filter by project (partial match)
  --list          Just list paths, no context
  --export PATH   Export first match to HTML

Examples:
  search.ts 'professional website'
  search.ts 'hn' 'research' --recent 7
  search.ts 'bug fix' --project myproject`);
  Deno.exit(0);
}

const term1 = String(args._[0]);
const term2 = args._[1] ? String(args._[1]) : undefined;

// Collect session files
const files: string[] = [];
const now = Date.now();
const recentMs = args.recent ? Number(args.recent) * 86400_000 : undefined;

for await (const entry of walk(DIR, { exts: [".jsonl"] })) {
  if (args.project && !entry.path.includes(args.project)) continue;
  if (recentMs) {
    const stat = await Deno.stat(entry.path);
    if (stat.mtime && now - stat.mtime.getTime() > recentMs) continue;
  }
  files.push(entry.path);
}

// Filter by terms using rg
const matches: string[] = [];
for (const f of files) {
  const hit1 = await $`rg -q ${term1} ${f}`.noThrow();
  if (hit1.code !== 0) continue;
  if (term2) {
    const hit2 = await $`rg -q ${term2} ${f}`.noThrow();
    if (hit2.code !== 0) continue;
  }
  matches.push(f);
}

if (matches.length === 0) {
  console.log(`No sessions found matching '${term1}'${term2 ? ` AND '${term2}'` : ""}`);
  Deno.exit(0);
}

// Export mode
if (args.export) {
  console.log(`Exporting: ${matches[0]}`);
  await $`pi --export ${matches[0]} ${args.export}`;
  Deno.exit(0);
}

// List mode
if (args.list) {
  for (const m of matches) console.log(m);
  Deno.exit(0);
}

// Display with context
console.log(`🔍 Found ${matches.length} session(s) matching '${term1}'${term2 ? ` AND '${term2}'` : ""}\n`);

for (const f of matches) {
  const project = basename(dirname(f)).replace(/--Users-sn-/, "").replace(/--/g, "/");
  const timestamp = basename(f).split("_")[0]?.replace("T", " ").slice(0, 16) ?? "";

  console.log(`📁 ${project}`);
  console.log(`   📅 ${timestamp}`);
  console.log(`   📄 ${f}`);

  // First user message
  const firstMsg = await $`rg '"role":"user"' ${f}`.noThrow();
  if (firstMsg.code === 0) {
    const line = firstMsg.stdout.split("\n")[0] ?? "";
    const text = line.match(/"text":"([^"]{0,80})/)?.[1];
    if (text) console.log(`   💬 ${text}...`);
  }

  // Matching context
  const pattern = term2 ? `(${term1}|${term2})` : term1;
  const ctx = await $`rg -o ${`.{0,30}${pattern}.{0,30}`} ${f}`.noThrow();
  if (ctx.code === 0) {
    const snippet = ctx.stdout.split("\n")[0]?.slice(0, 80);
    if (snippet) console.log(`   ✓ ...${snippet}...`);
  }

  console.log();
}

console.log("Resume: pi --session <path>");
console.log("Export: pi --export <path> output.html");
