#!/usr/bin/env node

import { spawn, execSync } from "node:child_process";

const useProfile = process.argv[2] === "--profile";

if (process.argv[2] && process.argv[2] !== "--profile") {
	console.log("Usage: browser-start.js [--profile]");
	console.log("\nOptions:");
	console.log("  --profile  Copy your default Chrome profile (cookies, logins)");
	process.exit(1);
}

const SCRAPING_DIR = `${process.env.HOME}/.cache/browser-tools`;

// Check if already running on :8222 (ABP default)
try {
	const res = await fetch("http://localhost:8222/api/v1/browser/status");
	if (res.ok) {
		console.log("✓ Agent Browser Protocol (ABP) already running on :8222");
		process.exit(0);
	}
} catch {}

// Setup profile directory
execSync(`mkdir -p "${SCRAPING_DIR}"`, { stdio: "ignore" });

// Start ABP
console.log("Starting Agent Browser Protocol (ABP)...");

const args = [
	"agent-browser-protocol",
	"--port", "8222",
	"--session-dir", SCRAPING_DIR,
];

if (useProfile) {
    // If user wants profile, they can pass it via ABP flags or we let ABP handle it.
    // For now, let's stick to the ABP default session-dir.
}

spawn("npx", ["-y", ...args], {
	detached: true,
	stdio: "ignore",
}).unref();

// Wait for ABP to be ready
let connected = false;
for (let i = 0; i < 60; i++) {
	try {
		const res = await fetch("http://localhost:8222/api/v1/browser/status");
		if (res.ok) {
			connected = true;
			break;
		}
	} catch {}
	await new Promise((r) => setTimeout(r, 500));
}

if (!connected) {
	console.error("✗ Failed to start Agent Browser Protocol");
	process.exit(1);
}

console.log("✓ Agent Browser Protocol started on :8222");
