#!/usr/bin/env -S deno run --allow-all
import $ from "jsr:@david/dax@0.44.2";
import { parseArgs } from "jsr:@std/cli";
import { ensureDir } from "jsr:@std/fs";
import { join } from "jsr:@std/path";

const args = parseArgs(Deno.args, {
  string: ["slug", "edit-code"],
  alias: { s: "slug", e: "edit-code" },
});

const file = args._[0] as string;
if (!file) {
  console.error("Usage: share.ts <file.md> [--slug name] [--edit-code code]");
  Deno.exit(1);
}

const text = await Deno.readTextFile(file);
const editCode = args["edit-code"] || crypto.randomUUID().slice(0, 12);

// Get CSRF token + cookies
const initResp = await fetch("https://rentry.co", {
  headers: { "User-Agent": "pi-share-md/1.0" },
});
const html = await initResp.text();
const csrf = html.match(/csrfmiddlewaretoken.*?value="([^"]+)"/)?.[1];
if (!csrf) {
  console.error("Failed to get CSRF token");
  Deno.exit(1);
}

// Extract cookies
const cookies = initResp.headers.getSetCookie()
  .map(c => c.split(";")[0])
  .join("; ");

// Build form
const form = new URLSearchParams();
form.set("csrfmiddlewaretoken", csrf);
form.set("edit_code", editCode);
form.set("text", text);
if (args.slug) form.set("url", args.slug);

// Post
const resp = await fetch("https://rentry.co/api/new", {
  method: "POST",
  headers: {
    "Cookie": cookies,
    "Referer": "https://rentry.co",
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "pi-share-md/1.0",
  },
  body: form.toString(),
});

const result = await resp.json();

if (result.status !== "200") {
  console.error("Error:", JSON.stringify(result));
  Deno.exit(1);
}

const url = result.url;

// Save edit code for future updates
const stateDir = join(Deno.env.get("HOME")!, ".local/share/share-md");
await ensureDir(stateDir);
const codesFile = join(stateDir, "codes.json");
let codes: Record<string, string> = {};
try { codes = JSON.parse(await Deno.readTextFile(codesFile)); } catch { /* first run */ }
const slug = url.replace("https://rentry.co/", "");
codes[slug] = editCode;
await Deno.writeTextFile(codesFile, JSON.stringify(codes, null, 2));

console.log(`\n✅ Published: ${url}`);
console.log(`📝 Edit code: ${editCode}`);
console.log(`   (saved to ${codesFile})`);
