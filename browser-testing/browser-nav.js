#!/usr/bin/env node

import { getActiveTabId, tabAction, ABP_BASE_URL } from "./abp-helper.js";

const url = process.argv[2];
const newTab = process.argv[3] === "--new";

if (!url) {
	console.log("Usage: browser-nav.js <url> [--new]");
	process.exit(1);
}

try {
	let tabId;
	if (newTab) {
		const res = await fetch(`${ABP_BASE_URL}/tabs`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ url })
		});
		const data = await res.json();
		tabId = data.id;
		console.log(`✓ Opened new tab: ${url}`);
	} else {
		tabId = await getActiveTabId();
		await tabAction(tabId, "navigate", { url });
		console.log(`✓ Navigated to: ${url}`);
	}
} catch (err) {
	console.error("✗ Navigation failed:", err.message);
	process.exit(1);
}
