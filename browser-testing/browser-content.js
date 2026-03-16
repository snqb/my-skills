#!/usr/bin/env node

import { getActiveTabId, tabAction } from "./abp-helper.js";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const url = process.argv[2];

if (!url) {
	console.log("Usage: browser-content.js <url>");
	process.exit(1);
}

try {
	const tabId = await getActiveTabId();
	
	// Navigate
	await tabAction(tabId, "navigate", { url });
	
	// Get HTML and URL
	const data = await tabAction(tabId, "execute", { script: "({ html: document.documentElement.outerHTML, url: window.location.href, title: document.title })" });
	const { html: outerHTML, url: finalUrl, title: pageTitle } = data;

	// Extract with Readability
	const doc = new JSDOM(outerHTML, { url: finalUrl });
	const reader = new Readability(doc.window.document);
	const article = reader.parse();

	// Convert to markdown
	function htmlToMarkdown(html) {
		const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
		turndown.use(gfm);
		return turndown
			.turndown(html)
			.replace(/\n{3,}/g, "\n\n")
			.trim();
	}

	let content;
	if (article && article.content) {
		content = htmlToMarkdown(article.content);
	} else {
		// Fallback
		const fallbackDoc = new JSDOM(outerHTML, { url: finalUrl });
		const fallbackBody = fallbackDoc.window.document;
		fallbackBody.querySelectorAll("script, style, noscript, nav, header, footer, aside").forEach((el) => el.remove());
		content = htmlToMarkdown(fallbackBody.body.innerHTML || "");
	}

	console.log(`URL: ${finalUrl}`);
	console.log(`Title: ${article?.title || pageTitle}`);
	console.log("");
	console.log(content || "(Could not extract content)");

} catch (err) {
	console.error("✗ Extraction failed:", err.message);
	process.exit(1);
}
