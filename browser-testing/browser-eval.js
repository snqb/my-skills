#!/usr/bin/env node

import { getActiveTabId, tabAction } from "./abp-helper.js";

const code = process.argv.slice(2).join(" ");
if (!code) {
	console.log("Usage: browser-eval.js 'code'");
	process.exit(1);
}

try {
	const tabId = await getActiveTabId();
	const res = await tabAction(tabId, "execute", { script: code });
	const result = res.result;
	
	if (Array.isArray(result)) {
		for (let i = 0; i < result.length; i++) {
			if (i > 0) console.log("");
			for (const [key, value] of Object.entries(result[i])) {
				console.log(`${key}: ${value}`);
			}
		}
	} else if (typeof result === "object" && result !== null) {
		for (const [key, value] of Object.entries(result)) {
			console.log(`${key}: ${value}`);
		}
	} else {
		console.log(result);
	}
} catch (err) {
	console.error("✗ Evaluation failed:", err.message);
	process.exit(1);
}
