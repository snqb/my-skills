#!/usr/bin/env node

import { getActiveTabId, tabAction } from "./abp-helper.js";

try {
	const tabId = await getActiveTabId();
	const res = await tabAction(tabId, "execute", { script: "document.cookie" });
	const cookiesStr = res.result;
	
	if (!cookiesStr) {
		console.log("No cookies found (or they are all HttpOnly)");
		process.exit(0);
	}
	
	const cookies = cookiesStr.split("; ").map(c => {
		const [name, value] = c.split("=");
		return { name, value };
	});

	for (const cookie of cookies) {
		console.log(`${cookie.name}: ${cookie.value}`);
		console.log("");
	}
	
	console.log("(Note: Only non-HttpOnly cookies are visible via document.cookie)");
} catch (err) {
	console.error("✗ Failed to get cookies:", err.message);
	process.exit(1);
}
