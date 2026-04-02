#!/usr/bin/env -S deno run --allow-all
/**
 * Swarm Orchestrator — spin up N Railway workers, distribute tasks, collect results.
 * 
 * Usage:
 *   deno run --allow-all swarm.ts --handler handler.ts --items items.jsonl --workers 5 --output results.jsonl
 */

import { parseArgs } from "jsr:@std/cli";

const SKILL_DIR = new URL(".", import.meta.url).pathname;
const WORKER_DIR = `${SKILL_DIR}worker`;

// --- Parse args ---
const args = parseArgs(Deno.args, {
  string: ["handler", "items", "output", "project"],
  default: { output: "/tmp/swarm-results.jsonl", workers: "5", concurrency: "3", project: "swarm-pool" },
});

const WORKERS = parseInt(args.workers as string || "5");
const CONCURRENCY = args.concurrency as string || "3";
const HANDLER_PATH = args.handler as string;
const ITEMS_PATH = args.items as string;
const OUTPUT = args.output as string;
const PROJECT_NAME = args.project as string;

if (!HANDLER_PATH || !ITEMS_PATH) {
  console.error("Usage: swarm.ts --handler <path> --items <jsonl> [--workers 5] [--output results.jsonl]");
  Deno.exit(1);
}

// --- Railway API ---
const RAILWAY_TOKEN = JSON.parse(await Deno.readTextFile(`${Deno.env.get("HOME")}/.railway/config.json`)).user.token;

async function gql(query: string, variables?: Record<string, unknown>) {
  const resp = await fetch("https://backboard.railway.app/graphql/v2", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RAILWAY_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const data = await resp.json();
  if (data.errors) throw new Error(JSON.stringify(data.errors));
  return data.data;
}

// --- Find or create project ---
async function getOrCreateProject(): Promise<{ projectId: string; envId: string }> {
  // Find existing
  const me = await gql(`{ me { workspaces { id name projects { edges { node { id name environments { edges { node { id name } } } } } } } } }`);
  for (const ws of me.me.workspaces) {
    for (const p of ws.projects.edges) {
      if (p.node.name === PROJECT_NAME) {
        const envId = p.node.environments.edges[0]?.node.id;
        console.error(`♻️  Reusing project "${PROJECT_NAME}" (${p.node.id.slice(0, 8)})`);
        return { projectId: p.node.id, envId };
      }
    }
  }

  // Create in Pro workspace
  // Find paid workspace — skip personal (trial expired)
  const proWs = me.me.workspaces.find((w: any) => !w.name.includes("Projects") && (w.name.includes("Pro") || w.name.includes("plan") || w.name.includes("Team")))
    || me.me.workspaces[me.me.workspaces.length - 1]; // fallback: last workspace
  if (!proWs) throw new Error("No paid workspace found");

  console.error(`🆕 Creating project "${PROJECT_NAME}" in ${proWs.name}`);
  const created = await gql(`mutation($input: ProjectCreateInput!) { projectCreate(input: $input) { id environments { edges { node { id } } } } }`,
    { input: { name: PROJECT_NAME, teamId: proWs.id } });

  return {
    projectId: created.projectCreate.id,
    envId: created.projectCreate.environments.edges[0].node.id,
  };
}

// --- Create worker service ---
async function createWorkerService(projectId: string, envId: string, workerId: number, taskChunk: string, handlerB64: string): Promise<{ serviceId: string; domain: string }> {
  // Create service
  const svc = await gql(
    `mutation($input: ServiceCreateInput!) { serviceCreate(input: $input) { id } }`,
    { input: { projectId, name: `w${workerId}` } },
  );
  const serviceId = svc.serviceCreate.id;

  // Link this directory to the service for CLI commands
  const realWorkerDir = await Deno.realPath(WORKER_DIR);
  const configPath = `${Deno.env.get("HOME")}/.railway/config.json`;
  const config = JSON.parse(await Deno.readTextFile(configPath));
  config.projects = config.projects || {};
  config.projects[realWorkerDir] = {
    projectPath: realWorkerDir,
    name: PROJECT_NAME,
    project: projectId,
    environment: envId,
    environmentName: "production",
    service: serviceId,
  };
  await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));

  // Set env vars via CLI (GraphQL variableCollectionUpsert requires higher permissions)
  const vars: Record<string, string> = {
    WORKER_ID: String(workerId),
    CONCURRENCY,
    HANDLER_B64: handlerB64,
    TASK_DATA: taskChunk,
  };

  const setArgs = Object.entries(vars).flatMap(([k, v]) => ["--set", `${k}=${v}`]);
  const varCmd = new Deno.Command("railway", {
    args: ["variables", ...setArgs],
    cwd: realWorkerDir,
    stdout: "piped",
    stderr: "piped",
  });
  const varResult = await varCmd.output();
  if (!varResult.success) {
    const err = new TextDecoder().decode(varResult.stderr);
    console.error(`  ⚠️  Failed to set vars for w${workerId}: ${err.slice(0, 100)}`);
  }

  // Generate domain for health checks
  const domainResult = await gql(
    `mutation { serviceDomainCreate(input: { environmentId: "${envId}", serviceId: "${serviceId}" }) { domain } }`,
  );
  const domain = domainResult.serviceDomainCreate.domain;

  return { serviceId, domain };
}

// --- Deploy worker ---
async function deployWorker(projectId: string, envId: string, serviceId: string) {
  const realWorkerDir = await Deno.realPath(WORKER_DIR);
  // Temporarily point config to this service for `railway up`
  const configPath = `${Deno.env.get("HOME")}/.railway/config.json`;
  const config = JSON.parse(await Deno.readTextFile(configPath));
  config.projects[realWorkerDir] = {
    ...config.projects[realWorkerDir],
    service: serviceId,
  };
  await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2));

  const proc = new Deno.Command("railway", {
    args: ["up", "--detach"],
    cwd: realWorkerDir,
    stdout: "piped",
    stderr: "piped",
  });
  const output = await proc.output();
  const text = new TextDecoder().decode(output.stdout) + new TextDecoder().decode(output.stderr);
  if (!output.success) {
    console.error(`  ⚠️  Deploy failed: ${text.slice(0, 200)}`);
  }
}

// --- Get worker URL (domain already created in createWorkerService) ---

// --- Poll workers ---
async function pollWorker(url: string): Promise<{ status: string; processed: number; total: number }> {
  try {
    const resp = await fetch(`${url}/health`, { signal: AbortSignal.timeout(5000) });
    return await resp.json();
  } catch {
    return { status: "unreachable", processed: 0, total: 0 };
  }
}

async function collectResults(url: string): Promise<string[]> {
  try {
    const resp = await fetch(`${url}/results`, { signal: AbortSignal.timeout(30000) });
    const text = await resp.text();
    return text.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

// --- Cleanup ---
async function deleteService(projectId: string, serviceId: string) {
  try {
    await gql(`mutation { serviceDelete(id: "${serviceId}") }`);
  } catch { /* ignore */ }
}

// ============ MAIN ============

console.error(`🐝 Swarm: ${WORKERS} workers, handler=${HANDLER_PATH}, items=${ITEMS_PATH}`);

// Load items
const items = (await Deno.readTextFile(ITEMS_PATH)).trim().split("\n").filter(Boolean);
console.error(`📦 ${items.length} items total`);

// Load handler and base64 encode
const handlerCode = await Deno.readTextFile(HANDLER_PATH);
const handlerB64 = btoa(handlerCode);

// Split items into chunks
const MAX_ITEMS_PER_WORKER = 200; // Railway env var 32KB limit
const chunkSize = Math.min(Math.ceil(items.length / WORKERS), MAX_ITEMS_PER_WORKER);
const chunks: string[][] = [];
for (let i = 0; i < items.length; i += chunkSize) {
  chunks.push(items.slice(i, i + chunkSize));
}
const actualWorkers = chunks.length;
if (actualWorkers > 50) {
  console.error(`⚠️  ${actualWorkers} workers needed (${items.length} items / ${chunkSize} per worker). Max 50. Truncating.`);
  chunks.splice(50);
}
console.error(`📊 ${chunks.length} workers, ~${chunkSize} items each`);

// Compress each chunk to base64
const chunkData: string[] = [];
for (const chunk of chunks) {
  const raw = new TextEncoder().encode(chunk.join("\n"));
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(raw);
  writer.close();
  const reader = cs.readable.getReader();
  const parts: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
  }
  const compressed = await new Blob(parts).arrayBuffer();
  chunkData.push(btoa(String.fromCharCode(...new Uint8Array(compressed))));
}

// Check sizes
const tooBig = chunkData.some(d => d.length > 900_000); // Railway env var limit ~1MB
if (tooBig) {
  console.error("⚠️  Task chunks too large for env vars. Use TASK_URL instead.");
  console.error("   Max chunk size after gzip+base64: ~900KB");
  Deno.exit(1);
}

// Get or create project
const { projectId, envId } = await getOrCreateProject();

// Cleanup old workers from previous runs
const existingServices = await gql(`{ project(id: "${projectId}") { services { edges { node { id name } } } } }`);
for (const svc of existingServices.project.services.edges) {
  if (svc.node.name.match(/^w\d+$/)) {
    console.error(`🧹 Deleting leftover ${svc.node.name}`);
    await deleteService(projectId, svc.node.id);
    await new Promise(r => setTimeout(r, 2000));
  }
}

// Create workers
console.error(`\n🚀 Creating ${actualWorkers} workers...`);
const workers: Array<{ id: number; serviceId: string; url: string }> = [];

for (let i = 0; i < actualWorkers; i++) {
  console.error(`  Creating w${i} (${chunks[i].length} items)...`);
  const { serviceId, domain } = await createWorkerService(projectId, envId, i, chunkData[i], handlerB64);
  workers.push({ id: i, serviceId, url: `https://${domain}` });

  // Railway rate limit: 1 service per ~5s
  if (i < actualWorkers - 1) await new Promise(r => setTimeout(r, 5000));
}

// Deploy all workers (same Dockerfile, different env vars)
console.error(`\n📤 Deploying workers...`);
for (const w of workers) {
  console.error(`  Deploying w${w.id}...`);
  await deployWorker(projectId, envId, w.serviceId);
  console.error(`    → ${w.url}`);
}

// Wait for build + deploy
console.error(`\n⏳ Waiting for build + deploy (~90s)...`);
await new Promise(r => setTimeout(r, 90000));

// Poll until all done
console.error(`⏳ Polling workers...`);
const startTime = Date.now();
const MAX_WAIT_MIN = 30;
let consecutiveUnreachable = 0;

while (true) {
  await new Promise(r => setTimeout(r, 15000));

  let allDone = true;
  let totalProcessed = 0;
  let anyReachable = false;

  for (const w of workers) {
    if (!w.url) continue;
    const health = await pollWorker(w.url);
    if (health.status !== "unreachable") {
      anyReachable = true;
      totalProcessed += health.processed;
      if (health.status !== "done" && health.status !== "error") allDone = false;
    } else {
      allDone = false;
    }
    console.error(`  w${w.id}: ${health.status} ${health.processed || 0}/${health.total || "?"}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.error(`  Total: ${totalProcessed}/${items.length} (${elapsed}min)`);

  if (!anyReachable) {
    consecutiveUnreachable++;
    if (consecutiveUnreachable > 8) {
      console.error(`  ⚠️  Workers unreachable for 2min+, might have failed to deploy`);
      break;
    }
  } else {
    consecutiveUnreachable = 0;
  }

  if (allDone && anyReachable) break;
  if (parseFloat(elapsed) > MAX_WAIT_MIN) {
    console.error(`  ⚠️  Timeout after ${MAX_WAIT_MIN}min`);
    break;
  }
}

// Collect results
console.error(`\n📥 Collecting results...`);
const file = await Deno.open(OUTPUT, { write: true, create: true, truncate: true });
const enc = new TextEncoder();
let totalCollected = 0;

for (const w of workers) {
  if (!w.url) continue;
  const results = await collectResults(w.url);
  for (const line of results) {
    file.writeSync(enc.encode(line + "\n"));
    totalCollected++;
  }
  console.error(`  w${w.id}: ${results.length} results`);
}
file.close();

console.error(`\n✅ Collected ${totalCollected} results → ${OUTPUT}`);

// Cleanup
console.error(`\n🧹 Tearing down workers...`);
for (const w of workers) {
  await deleteService(projectId, w.serviceId);
  console.error(`  Deleted w${w.id}`);
}

console.error(`\n🐝 Swarm complete! ${totalCollected} results in ${((Date.now() - startTime) / 1000 / 60).toFixed(1)}min`);
