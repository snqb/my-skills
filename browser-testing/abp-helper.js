// abp-helper.js
// Shared logic for ABP REST API interaction

export const ABP_BASE_URL = "http://localhost:8222/api/v1";

/**
 * Gets the ID of the current active tab in ABP.
 */
export async function getActiveTabId() {
	try {
		const res = await fetch(`${ABP_BASE_URL}/tabs`);
		if (!res.ok) throw new Error(`Failed to list tabs: ${res.statusText}`);
		
		const tabs = await res.json();
		const activeTab = tabs.find(t => t.active) || tabs[0];
		
		if (activeTab) return activeTab.id;
		
		// Create a new tab if none exist
		const createRes = await fetch(`${ABP_BASE_URL}/tabs`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ url: "about:blank" })
		});
		const newTab = await createRes.json();
		return newTab.id;
	} catch (err) {
		console.error("✗ Error communicating with ABP:", err.message);
		console.error("  Ensure ABP is running on :8222 (run browser-start.js first)");
		process.exit(1);
	}
}

/**
 * Executes a POST request to an ABP tab endpoint and returns the unwrapped result.
 */
export async function tabAction(tabId, action, body = {}) {
	const res = await fetch(`${ABP_BASE_URL}/tabs/${tabId}/${action}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body)
	});
	
	const data = await res.json();
	if (!res.ok) {
		throw new Error(data.message || data.error || `Action failed: ${res.statusText}`);
	}

	// ABP's 'execute' returns { result: { type: "...", value: ... } }
	// Other actions return { result: { ... } }
	if (data.result && typeof data.result === 'object' && 'value' in data.result) {
		return data.result.value;
	}
	return data.result;
}
