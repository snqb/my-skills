#!/usr/bin/env node

import { getActiveTabId, tabAction } from "./abp-helper.js";

const text = process.argv.slice(2).join(" ");

if (!text) {
	console.log("Usage: browser-type.js <text>");
	process.exit(1);
}

try {
	const tabId = await getActiveTabId();
	await tabAction(tabId, "type", { text });
	console.log(`✓ Typed: ${text}`);
} catch (err) {
	console.error("✗ Typing failed:", err.message);
	process.exit(1);
}
