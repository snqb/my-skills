#!/usr/bin/env node

import { getActiveTabId, tabAction } from "./abp-helper.js";

const x = parseInt(process.argv[2]);
const y = parseInt(process.argv[3]);

if (isNaN(x) || isNaN(y)) {
	console.log("Usage: browser-click.js <x> <y>");
	process.exit(1);
}

try {
	const tabId = await getActiveTabId();
	await tabAction(tabId, "click", { x, y });
	console.log(`✓ Clicked at ${x}, ${y}`);
} catch (err) {
	console.error("✗ Click failed:", err.message);
	process.exit(1);
}
