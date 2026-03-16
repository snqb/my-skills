#!/usr/bin/env node

import { getActiveTabId, tabAction } from "./abp-helper.js";

const code = process.argv.slice(2).join(" ");
if (!code) {
	console.log("Usage: browser-eval.js 'code'");
	process.exit(1);
}

try {
	const tabId = await getActiveTabId();
	const result = await tabAction(tabId, "execute", { script: code });
	
	if (Array.isArray(result)) {
		for (let i = 0; i < result.length; i++) {
			if (i > 0) console.log("");
			console.log(JSON.stringify(result[i], null, 2));
		}
	} else if (typeof result === "object" && result !== null) {
		console.log(JSON.stringify(result, null, 2));
	} else {
		console.log(result);
	}
} catch (err) {
	console.error("✗ Evaluation failed:", err.message);
	process.exit(1);
}
