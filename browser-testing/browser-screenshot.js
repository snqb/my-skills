#!/usr/bin/env node

import { tmpdir } from "node:os";
import { join } from "node:path";
import { getActiveTabId, ABP_BASE_URL } from "./abp-helper.js";
import { writeFileSync } from "node:fs";

try {
	const tabId = await getActiveTabId();
	const markup = process.argv[2] || "interactive";
	
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const filename = `screenshot-${timestamp}.webp`;
	const filepath = join(tmpdir(), filename);
	
	// ABP returns screenshot in binary via GET or base64 via POST
	// Let's use the POST action to get the standard response envelope with potential errors
	const res = await fetch(`${ABP_BASE_URL}/tabs/${tabId}/screenshot`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ screenshot: { markup, format: "webp" } })
	});
	
	if (!res.ok) throw new Error(`Failed to capture screenshot: ${res.statusText}`);
	
	const data = await res.json();
	const base64Data = data.screenshot_after.data;
	
	writeFileSync(filepath, Buffer.from(base64Data, "base64"));
	
	console.log(filepath);
} catch (err) {
	console.error("✗ Screenshot failed:", err.message);
	process.exit(1);
}
