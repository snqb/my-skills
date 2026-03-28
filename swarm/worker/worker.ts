/**
 * Swarm Worker — generic task runner for Railway.
 * 
 * Env vars:
 *   TASK_DATA   — base64 gzipped JSONL (for small batches)
 *   TASK_URL    — URL to download JSONL from (for large batches)
 *   HANDLER_URL — URL to download handler .ts from
 *   HANDLER_B64 — base64 encoded handler .ts (alternative to URL)
 *   WORKER_ID   — this worker's ID (0-indexed)
 *   CONCURRENCY — parallel tasks per worker (default: 3)
 *   PORT        — HTTP port (default: 8000)
 */

import { pooledMap } from "jsr:@std/async";

const PORT = parseInt(Deno.env.get("PORT") || "8000");
const WORKER_ID = Deno.env.get("WORKER_ID") || "0";
const CONCURRENCY = parseInt(Deno.env.get("CONCURRENCY") || "3");

// State
let status = "loading";
let processed = 0;
let total = 0;
let ok = 0;
let errors = 0;
const results: string[] = [];

// --- Load tasks ---
async function loadTasks(): Promise<any[]> {
  const taskData = Deno.env.get("TASK_DATA");
  const taskUrl = Deno.env.get("TASK_URL");

  let raw: string;
  if (taskData) {
    // Decode base64 → gunzip → JSONL
    const bytes = Uint8Array.from(atob(taskData), c => c.charCodeAt(0));
    const ds = new DecompressionStream("gzip");
    const writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const reader = ds.readable.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    raw = new TextDecoder().decode(await new Blob(chunks).arrayBuffer());
  } else if (taskUrl) {
    const resp = await fetch(taskUrl);
    raw = await resp.text();
  } else {
    throw new Error("No TASK_DATA or TASK_URL");
  }

  return raw.trim().split("\n").filter(Boolean).map(l => JSON.parse(l));
}

// --- Load handler ---
async function loadHandler(): Promise<(item: any) => Promise<any>> {
  const handlerUrl = Deno.env.get("HANDLER_URL");
  const handlerB64 = Deno.env.get("HANDLER_B64");

  if (handlerB64) {
    const code = atob(handlerB64);
    const blob = new Blob([code], { type: "application/typescript" });
    const url = URL.createObjectURL(blob);
    const mod = await import(url);
    return mod.handle;
  } else if (handlerUrl) {
    const mod = await import(handlerUrl);
    return mod.handle;
  } else {
    throw new Error("No HANDLER_URL or HANDLER_B64");
  }
}

// --- HTTP server (health + results) ---
Deno.serve({ port: PORT }, (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/health") {
    return Response.json({ status, worker: WORKER_ID, processed, total, ok, errors });
  }

  if (url.pathname === "/results") {
    return new Response(results.join("\n") + "\n", {
      headers: { "Content-Type": "application/x-ndjson" },
    });
  }

  return new Response("swarm worker", { status: 200 });
});

// --- Main ---
try {
  status = "loading_tasks";
  const tasks = await loadTasks();
  total = tasks.length;
  console.error(`Worker ${WORKER_ID}: ${total} tasks, concurrency ${CONCURRENCY}`);

  status = "loading_handler";
  const handle = await loadHandler();

  status = "running";
  for await (const result of pooledMap(CONCURRENCY, tasks, async (item) => {
    try {
      return await handle(item);
    } catch (e) {
      return { ...item, _error: String(e).slice(0, 200) };
    }
  })) {
    const line = JSON.stringify(result);
    results.push(line);
    processed++;
    if (result._error) errors++;
    else ok++;
    if (processed % 50 === 0) {
      console.error(`Worker ${WORKER_ID}: ${processed}/${total} ok=${ok} err=${errors}`);
    }
  }

  status = "done";
  console.error(`Worker ${WORKER_ID}: DONE. ${processed} processed, ${ok} ok, ${errors} errors`);
} catch (e) {
  status = "error";
  console.error(`Worker ${WORKER_ID} FATAL: ${e}`);
}
