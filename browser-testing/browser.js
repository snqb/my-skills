#!/usr/bin/env -S deno run -A
// browser.js — Full Agent Browser Protocol (ABP) CLI
// https://github.com/theredsix/agent-browser-protocol

import { decodeBase64 } from "jsr:@std/encoding@^1/base64";

const HOME = Deno.env.get("HOME") || "/tmp";

// ── Port Resolution ──
// Priority: --port flag > ABP_PORT env > hash(project root) → 9222-19221

function projectRoot() {
	let dir = Deno.cwd();
	while (true) {
		try { if (Deno.statSync(`${dir}/.git`).isDirectory) return dir; } catch {}
		const parent = dir.replace(/\/[^/]+$/, "");
		if (parent === dir) break;
		dir = parent;
	}
	return Deno.cwd();
}

function resolvePort() {
	if (flags.port) return Number(flags.port);
	const envPort = Deno.env.get("ABP_PORT");
	if (envPort) return Number(envPort);
	const root = projectRoot();
	let h = 0;
	for (let i = 0; i < root.length; i++) h = ((h << 5) - h + root.charCodeAt(i)) | 0;
	return 9222 + (Math.abs(h) % 10000);
}

let PORT, API;
function initAPI() {
	PORT = resolvePort();
	API = `http://localhost:${PORT}/api/v1`;
}

// ── HTTP ──

async function api(method, path, body) {
	const opts = { method, headers: { "Content-Type": "application/json" } };
	if (body !== undefined) opts.body = JSON.stringify(body);
	const r = await fetch(`${API}${path}`, opts);
	if (r.status === 204) return {};
	const d = await r.json();
	if (!r.ok) throw new Error(d.message || d.error || r.statusText);
	return d;
}

function unwrap(data) {
	const r = data?.result;
	return r && typeof r === "object" && "value" in r ? r.value : r;
}

function startArgs() {
	const args = ["-y", "agent-browser-protocol", "--port", String(PORT)];
	const dir = flags["session-dir"] || `${HOME}/.cache/browser-tools`;
	args.push("--session-dir", dir);
	if (flags.headless) args.push("--headless");
	if (flags.verbose) args.push("--verbose");
	if (flags["user-data-dir"]) args.push("--user-data-dir", flags["user-data-dir"]);
	if (flags["profile-directory"]) args.push("--profile-directory", flags["profile-directory"]);
	if (flags["user-agent"]) args.push("--user-agent", flags["user-agent"]);
	if (flags.zoom) args.push("--zoom", flags.zoom);
	if (flags["min-wait"]) args.push("--min-wait", flags["min-wait"]);
	if (flags["tracking-timeout"]) args.push("--tracking-timeout", flags["tracking-timeout"]);
	if (flags["post-settle"]) args.push("--post-settle", flags["post-settle"]);
	if (flags["disable-pause"]) args.push("--disable-pause");
	if (flags["config-file"]) args.push("--config-file", flags["config-file"]);
	// Chrome flags after --
	if (flags["chrome-args"]) { args.push("--"); args.push(...flags["chrome-args"].split(",")); }
	return { args, dir };
}

async function ensureRunning() {
	try { await fetch(`${API}/browser/status`); return; } catch {}
	console.error(`⟳ ABP down, starting on :${PORT}...`);
	const { args, dir } = startArgs();
	await Deno.mkdir(dir, { recursive: true });
	new Deno.Command("npx", {
		args,
		stdin: "null", stdout: "null", stderr: "null",
	}).spawn().unref();
	for (let i = 0; i < 60; i++) {
		try { if ((await fetch(`${API}/browser/status`)).ok) { console.error(`✓ ABP started on :${PORT}`); return; } } catch {}
		await new Promise(r => setTimeout(r, 500));
	}
	throw new Error(`Failed to start ABP on :${PORT}`);
}

async function activeTab(id) {
	if (id) return id;
	await ensureRunning();
	const tabs = await api("GET", "/tabs");
	const t = tabs.find((t) => t.active) || tabs[0];
	if (t) return t.id;
	return (await api("POST", "/tabs", { url: "about:blank" })).id;
}

// ── Screenshot & Events ──

function shotDir() {
	try {
		const git = Deno.cwd() + "/.git";
		if (Deno.statSync(git).isDirectory) {
			const dir = git + "/screenshots";
			try { Deno.mkdirSync(dir); } catch { /* exists */ }
			return dir;
		}
	} catch { /* no .git */ }
	const dir = `${HOME}/.cache/abp-screenshots`;
	try { Deno.mkdirSync(dir, { recursive: true }); } catch { /* exists */ }
	return dir;
}

function saveShot(envelope, label) {
	const s = envelope?.screenshot_after;
	if (!s?.data) return null;
	const d = new Date();
	const ts = [d.getFullYear(), d.getMonth()+1, d.getDate()].map(n => String(n).padStart(2,"0")).join("")
		+ "-" + [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2,"0")).join("");
	const fmt = s.format || "webp";
	const p = `${shotDir()}/${label || "shot"}-${ts}.${fmt}`;
	Deno.writeFileSync(p, decodeBase64(s.data));
	return p;
}

function printEvents(data) {
	for (const e of data?.events || []) {
		const d = e.data || {};
		const msgs = {
			navigation: `→ ${d.url}`,
			dialog: `⚠ dialog (${d.dialog_type}): ${d.message}`,
			file_chooser: `📁 file chooser id=${d.id} type=${d.chooser_type}`,
			download_started: `⬇ download: ${d.url || d.filename}`,
			download_completed: `✓ download: ${d.filename}`,
			select_open: `▾ select id=${d.id} (${d.options?.length} options)`,
			permission_requested: `🔐 permission id=${d.id} ${d.permission_type}`,
			popup: `↗ popup: ${d.url}`,
		};
		console.log(`  ${msgs[e.type] || `${e.type}: ${JSON.stringify(d)}`}`);
	}
}

function fileUrl(p) { return `file://${p}`; }

function out(data, label) {
	if (flags.json) return console.log(JSON.stringify(data, null, 2));
	if (flags.shot || flags.markup) {
		const p = saveShot(data, label);
		if (p) console.log(fileUrl(p));
	}
	printEvents(data);
	if (data?.scroll && ["scroll", "nav", "screenshot"].includes(cmd)) {
		const s = data.scroll;
		console.log(`  scroll: ${s.scrollX},${s.scrollY} page: ${s.pageWidth}×${s.pageHeight}`);
	}
}

function shotOpts() {
	if (!flags.shot && !flags.markup && !flags.format) return {};
	return {
		screenshot: {
			format: flags.format || "webp",
			markup: flags.markup === "none" ? []
				: flags.markup ? flags.markup.split(",")
				: "interactive",
		},
	};
}

// ── Args ──

const args = Deno.args;
const cmd = args[0];
const flags = {}, pos = [];
for (let i = 1; i < args.length; i++) {
	if (args[i].startsWith("--")) {
		const k = args[i].slice(2);
		flags[k] = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
	} else pos.push(args[i]);
}

// ── Pick script (injected into browser) ──

const pickJS = (msg) => `(async () => {
	return new Promise((resolve) => {
		const sels = [], selEls = new Set();
		const ov = document.createElement("div");
		ov.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:none";
		const hl = document.createElement("div");
		hl.style.cssText = "position:absolute;border:2px solid #3b82f6;background:rgba(59,130,246,0.1);transition:all 0.1s";
		ov.appendChild(hl);
		const bn = document.createElement("div");
		bn.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1f2937;color:white;padding:12px 24px;border-radius:8px;font:14px sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.3);pointer-events:auto;z-index:2147483647";
		const upd = () => { bn.textContent = "${msg.replace(/"/g, '\\"')} (" + sels.length + " selected, Cmd/Ctrl+click to add, Enter to finish, ESC to cancel)"; };
		upd(); document.body.append(bn, ov);
		const clean = () => { document.removeEventListener("mousemove",onM,true); document.removeEventListener("click",onC,true); document.removeEventListener("keydown",onK,true); ov.remove(); bn.remove(); selEls.forEach(e => e.style.outline = ""); };
		const info = (el) => ({ tag: el.tagName.toLowerCase(), id: el.id||null, class: el.className||null, text: el.textContent?.trim().slice(0,200)||null, html: el.outerHTML.slice(0,500) });
		const onM = (e) => { const el = document.elementFromPoint(e.clientX,e.clientY); if(!el||ov.contains(el)||bn.contains(el)) return; const r = el.getBoundingClientRect(); Object.assign(hl.style,{top:r.top+"px",left:r.left+"px",width:r.width+"px",height:r.height+"px"}); };
		const onC = (e) => { if(bn.contains(e.target)) return; e.preventDefault(); e.stopPropagation(); const el = document.elementFromPoint(e.clientX,e.clientY); if(!el||ov.contains(el)||bn.contains(el)) return; if(e.metaKey||e.ctrlKey){if(!selEls.has(el)){selEls.add(el);el.style.outline="3px solid #10b981";sels.push(info(el));upd();}}else{clean();resolve(JSON.stringify(sels.length>0?sels:info(el)));} };
		const onK = (e) => { if(e.key==="Escape"){e.preventDefault();clean();resolve("null");}else if(e.key==="Enter"&&sels.length>0){e.preventDefault();clean();resolve(JSON.stringify(sels));} };
		document.addEventListener("mousemove",onM,true); document.addEventListener("click",onC,true); document.addEventListener("keydown",onK,true);
	});
})()`;

// ── Init (after args parsed) ──
initAPI();

// ── Commands ──

async function run() {
	switch (cmd) {

	// ═══ Lifecycle ═══

	case "start": {
		await ensureRunning();
		console.log(`✓ ABP running on :${PORT} (${projectRoot()})`);
		return;
	}

	case "port": {
		console.log(PORT);
		return;
	}

	case "status":
		return console.log(JSON.stringify(await api("GET", "/browser/status"), null, 2));

	case "shutdown":
		await api("POST", "/browser/shutdown", { timeout_ms: Number(flags.timeout) || 5000 });
		return console.log("✓ Shutdown");

	// ═══ Navigation ═══

	case "nav": {
		const url = pos[0];
		if (!url) throw new Error("Usage: nav <url> [--new]");
		if (flags.new) {
			out(await api("POST", "/tabs", { url, ...shotOpts() }), "nav");
			console.log(`✓ new tab: ${url}`);
		} else {
			const id = await activeTab(flags.tab);
			out(await api("POST", `/tabs/${id}/navigate`, { url, ...shotOpts() }), "nav");
			console.log(`✓ ${url}`);
		}
		return;
	}

	case "back":    { const id = await activeTab(flags.tab); out(await api("POST", `/tabs/${id}/back`, shotOpts()), "back"); return; }
	case "forward": { const id = await activeTab(flags.tab); out(await api("POST", `/tabs/${id}/forward`, shotOpts()), "fwd"); return; }
	case "reload":  { const id = await activeTab(flags.tab); out(await api("POST", `/tabs/${id}/reload`, shotOpts()), "reload"); return; }

	// ═══ Mouse ═══

	case "click": {
		const [x, y] = pos.map(Number);
		if (isNaN(x) || isNaN(y)) throw new Error("Usage: click <x> <y> [--right] [--double] [--mod CTRL,SHIFT]");
		const body = { x, y, ...shotOpts() };
		if (flags.right) body.button = "right";
		if (flags.double) body.click_count = 2;
		if (flags.mod) body.modifiers = flags.mod.split(",").map(m => m.toUpperCase());
		const id = await activeTab(flags.tab);
		out(await api("POST", `/tabs/${id}/click`, body), "click");
		console.log(`✓ click ${x},${y}`);
		return;
	}

	case "hover": {
		const [x, y] = pos.map(Number);
		if (isNaN(x) || isNaN(y)) throw new Error("Usage: hover <x> <y>");
		const id = await activeTab(flags.tab);
		out(await api("POST", `/tabs/${id}/move`, { x, y, ...shotOpts() }), "hover");
		console.log(`✓ hover ${x},${y}`);
		return;
	}

	case "scroll": {
		const [x, y] = pos.map(Number);
		if (isNaN(x) || isNaN(y)) throw new Error("Usage: scroll <x> <y> --dy N [--dx N]");
		const scrolls = [];
		if (flags.dy) scrolls.push({ delta_px: Number(flags.dy), direction: "y" });
		if (flags.dx) scrolls.push({ delta_px: Number(flags.dx), direction: "x" });
		if (!scrolls.length) throw new Error("Need --dy and/or --dx");
		const id = await activeTab(flags.tab);
		out(await api("POST", `/tabs/${id}/scroll`, { x, y, scrolls, ...shotOpts() }), "scroll");
		console.log(`✓ scroll at ${x},${y}`);
		return;
	}

	case "drag": {
		const [x1, y1, x2, y2] = pos.map(Number);
		if ([x1, y1, x2, y2].some(isNaN)) throw new Error("Usage: drag <x1> <y1> <x2> <y2> [--steps N]");
		const body = { start_x: x1, start_y: y1, end_x: x2, end_y: y2, ...shotOpts() };
		if (flags.steps) body.steps = Number(flags.steps);
		const id = await activeTab(flags.tab);
		out(await api("POST", `/tabs/${id}/drag`, body), "drag");
		console.log(`✓ drag ${x1},${y1} → ${x2},${y2}`);
		return;
	}

	// ═══ Keyboard ═══

	case "type": {
		const text = pos.join(" ");
		if (!text) throw new Error("Usage: type <text>");
		const id = await activeTab(flags.tab);
		out(await api("POST", `/tabs/${id}/type`, { text, ...shotOpts() }), "type");
		console.log(`✓ typed: ${text}`);
		return;
	}

	case "key": {
		const key = pos[0];
		if (!key) throw new Error("Usage: key <KEY> [--mod CTRL,SHIFT] [--action down|up]");
		const body = { key: key.toUpperCase(), ...shotOpts() };
		if (flags.mod) body.modifiers = flags.mod.split(",").map(m => m.toUpperCase());
		const action = flags.action || "press";
		const ep = action === "press" ? "keyboard/press" : `keyboard/${action}`;
		const id = await activeTab(flags.tab);
		out(await api("POST", `/tabs/${id}/${ep}`, body), "key");
		console.log(`✓ key ${key}${flags.mod ? ` +${flags.mod}` : ""}`);
		return;
	}

	// ═══ Input Helpers ═══

	case "slider": {
		const [x, y, value] = pos.map(Number);
		if ([x, y, value].some(isNaN)) throw new Error("Usage: slider <x> <y> <value>");
		const id = await activeTab(flags.tab);
		out(await api("POST", `/tabs/${id}/slider`, { x, y, value, ...shotOpts() }), "slider");
		console.log(`✓ slider → ${value}`);
		return;
	}

	case "clear": {
		const [x, y] = pos.map(Number);
		if (isNaN(x) || isNaN(y)) throw new Error("Usage: clear <x> <y>");
		const id = await activeTab(flags.tab);
		out(await api("POST", `/tabs/${id}/clear-text`, { x, y, ...shotOpts() }), "clear");
		console.log("✓ cleared");
		return;
	}

	case "pick": {
		const msg = pos.join(" ") || "Click an element";
		const id = await activeTab(flags.tab);
		const data = await api("POST", `/tabs/${id}/execute`, { script: pickJS(msg) });
		const result = JSON.parse(unwrap(data));
		if (!result) return console.log("Cancelled");
		console.log(JSON.stringify(result, null, 2));
		return;
	}

	// ═══ Screenshot & Content ═══

	case "fullpage": {
		const id = await activeTab(flags.tab);
		const { Buffer } = await import("node:buffer");
		const { PNG } = await import("npm:pngjs@7.0.0");
		// Get page dimensions
		const dims = unwrap(await api("POST", `/tabs/${id}/execute`, {
			script: "({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, vw: window.innerWidth, vh: window.innerHeight })"
		}));
		const { w, h, vw, vh } = dims;
		// Scroll to top
		await api("POST", `/tabs/${id}/execute`, { script: "window.scrollTo(0, 0)" });
		await api("POST", `/tabs/${id}/wait`, { ms: 100 });
		// Capture viewport-sized chunks as raw PNG buffers
		const chunks = [];
		let y = 0;
		while (y < h) {
			await api("POST", `/tabs/${id}/execute`, { script: `window.scrollTo(0, ${y})` });
			await api("POST", `/tabs/${id}/wait`, { ms: 150 });
			const data = await api("POST", `/tabs/${id}/screenshot`, {
				screenshot: { format: "png", markup: "none" }
			});
			const s = data?.screenshot_after;
			if (!s?.data) throw new Error("No screenshot data at offset " + y);
			chunks.push({ buf: decodeBase64(s.data), cropH: Math.min(vh, h - y) });
			y += vh;
		}
		// Stitch in-memory with pngjs — no temp files, no external tools
		const out = new PNG({ width: vw, height: h });
		let destY = 0;
		for (const c of chunks) {
			const src = PNG.sync.read(Buffer.from(c.buf));
			const rowBytes = vw * 4;
			for (let row = 0; row < c.cropH; row++) {
				src.data.copy(out.data, (destY + row) * rowBytes, row * rowBytes, row * rowBytes + rowBytes);
			}
			destY += c.cropH;
		}
		const outBuf = PNG.sync.write(out);
		const d = new Date();
		const ts = [d.getFullYear(), d.getMonth()+1, d.getDate()].map(n => String(n).padStart(2,"0")).join("")
			+ "-" + [d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2,"0")).join("");
		const outPath = `${shotDir()}/fullpage-${ts}.png`;
		Deno.writeFileSync(outPath, outBuf);
		// Restore scroll position
		await api("POST", `/tabs/${id}/execute`, { script: "window.scrollTo(0, 0)" });
		console.log(fileUrl(outPath));
		console.log(`  ${w}×${h} (${chunks.length} chunks)`);
		return;
	}

	case "screenshot": {
		const id = await activeTab(flags.tab);
		const body = { screenshot: {
			format: flags.format || "webp",
			markup: flags.markup === "none" ? []
				: flags.markup ? flags.markup.split(",")
				: "interactive",
		}};
		const data = await api("POST", `/tabs/${id}/screenshot`, body);
		if (flags.json) return console.log(JSON.stringify(data, null, 2));
		const p = saveShot(data, "screenshot");
		if (p) console.log(fileUrl(p));
		else console.error("✗ No screenshot data");
		printEvents(data);
		return;
	}

	case "text": {
		const id = await activeTab(flags.tab);
		const data = await api("POST", `/tabs/${id}/text`, pos[0] ? { selector: pos[0] } : {});
		console.log(unwrap(data) ?? JSON.stringify(data));
		return;
	}

	case "eval": {
		const code = pos.join(" ");
		if (!code) throw new Error("Usage: eval '<code>'");
		const id = await activeTab(flags.tab);
		const data = await api("POST", `/tabs/${id}/execute`, { script: code, ...shotOpts() });
		if (flags.json) return console.log(JSON.stringify(data, null, 2));
		const result = unwrap(data);
		if (result !== undefined && result !== null)
			console.log(typeof result === "object" ? JSON.stringify(result, null, 2) : result);
		if (flags.shot) { const p = saveShot(data, "eval"); if (p) console.log(fileUrl(p)); }
		printEvents(data);
		return;
	}

	case "content": {
		const url = pos[0];
		const id = await activeTab(flags.tab);
		if (url) await api("POST", `/tabs/${id}/navigate`, { url });
		const raw = await api("POST", `/tabs/${id}/execute`, {
			script: "({ html: document.documentElement.outerHTML, url: window.location.href, title: document.title })",
		});
		const { html, url: finalUrl, title } = unwrap(raw);
		const [{ Readability }, { JSDOM }, { default: TurndownService }, { gfm }] = await Promise.all([
			import("npm:@mozilla/readability@^0.6.0"),
			import("npm:jsdom@^27.0.1"),
			import("npm:turndown@^7.2.2"),
			import("npm:turndown-plugin-gfm@^1.0.2"),
		]);
		const doc = new JSDOM(html, { url: finalUrl });
		const article = new Readability(doc.window.document).parse();
		const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
		td.use(gfm);
		let md;
		if (article?.content) {
			md = td.turndown(article.content);
		} else {
			const fb = new JSDOM(html, { url: finalUrl });
			fb.window.document.querySelectorAll("script,style,noscript,nav,header,footer,aside").forEach(e => e.remove());
			md = td.turndown(fb.window.document.body.innerHTML || "");
		}
		console.log(`URL: ${finalUrl}\nTitle: ${article?.title || title}\n`);
		console.log(md.replace(/\n{3,}/g, "\n\n").trim() || "(No content)");
		return;
	}

	case "cookies": {
		const id = await activeTab(flags.tab);
		const str = unwrap(await api("POST", `/tabs/${id}/execute`, { script: "document.cookie" }));
		if (!str) return console.log("No cookies (or all HttpOnly)");
		for (const c of str.split("; ")) { const [n, ...v] = c.split("="); console.log(`${n}: ${v.join("=")}`); }
		return;
	}

	// ═══ Tabs ═══

	case "tabs": {
		const [action = "list", arg] = pos;
		if (action === "list") {
			for (const t of await api("GET", "/tabs"))
				console.log(`${t.active ? "→" : " "} ${t.id}  ${t.url}  ${t.title || ""}`);
		} else if (action === "new") {
			console.log(`✓ ${(await api("POST", "/tabs", { url: arg || "about:blank" })).id}`);
		} else if (action === "close") {
			await api("DELETE", `/tabs/${arg}`); console.log("✓ closed");
		} else if (action === "activate") {
			await api("POST", `/tabs/${arg}/activate`); console.log("✓ activated");
		} else if (action === "info") {
			console.log(JSON.stringify(await api("GET", `/tabs/${arg}`), null, 2));
		} else if (action === "stop") {
			await api("POST", `/tabs/${arg}/stop`); console.log("✓ stopped");
		} else throw new Error(`Unknown: tabs ${action}`);
		return;
	}

	// ═══ Dialogs ═══

	case "dialog": {
		const [action = "check"] = pos;
		const id = await activeTab(flags.tab);
		if (action === "check") {
			console.log(JSON.stringify(await api("GET", `/tabs/${id}/dialog`), null, 2));
		} else if (action === "accept") {
			await api("POST", `/tabs/${id}/dialog/accept`, pos[1] ? { prompt_text: pos[1] } : {});
			console.log("✓ accepted");
		} else if (action === "dismiss") {
			await api("POST", `/tabs/${id}/dialog/dismiss`); console.log("✓ dismissed");
		} else throw new Error(`Unknown: dialog ${action}`);
		return;
	}

	// ═══ Downloads ═══

	case "download": {
		const [action = "list", arg] = pos;
		if (action === "list") {
			const params = [];
			if (flags.state) params.push(`state=${flags.state}`);
			if (flags.limit) params.push(`limit=${flags.limit}`);
			const qs = params.length ? `?${params.join("&")}` : "";
			console.log(JSON.stringify(await api("GET", `/downloads${qs}`), null, 2));
		}
		else if (action === "status") console.log(JSON.stringify(await api("GET", `/downloads/${arg}`), null, 2));
		else if (action === "cancel") { await api("POST", `/downloads/${arg}/cancel`); console.log("✓"); }
		else if (action === "get") {
			const qs = flags["max-size"] ? `?max_size=${flags["max-size"]}` : "";
			console.log(JSON.stringify(await api("GET", `/downloads/${arg}/content${qs}`), null, 2));
		}
		else throw new Error(`Unknown: download ${action}`);
		return;
	}

	// ═══ File Chooser ═══

	case "file": {
		const fid = pos[0];
		if (!fid) throw new Error("Usage: file <chooser_id> <paths...> [--cancel] [--save path]");
		if (flags.cancel) {
			await api("POST", `/file-chooser/${fid}`, { cancel: true });
		} else if (flags.save) {
			await api("POST", `/file-chooser/${fid}`, { path: flags.save });
		} else {
			const files = pos.slice(1);
			if (!files.length) throw new Error("Provide file paths, --cancel, or --save <path>");
			await api("POST", `/file-chooser/${fid}`, { files });
		}
		console.log("✓");
		return;
	}

	// ═══ Native Select ═══

	case "select": {
		const [sid, idx] = pos;
		if (!sid || idx === undefined) throw new Error("Usage: select <select_id> <index>");
		await api("POST", `/select/${sid}`, { index: Number(idx) });
		console.log(`✓ option ${idx}`);
		return;
	}

	// ═══ Observe / Assert / Watch ═══

	case "observe": {
		const id = await activeTab(flags.tab);
		const scope = pos[0] ? JSON.stringify(pos[0]) : "null";
		const script = `(() => {
			const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
			const root = ${scope} ? document.querySelector(${scope}) : document;
			if (${scope} && !root) return { error: 'selector not found: ' + ${scope} };
			const r = { url: location.href, title: document.title };
			r.scroll = { x: window.scrollX, y: window.scrollY, pageW: document.documentElement.scrollWidth, pageH: document.documentElement.scrollHeight, viewH: window.innerHeight };
			r.inputs = [...root.querySelectorAll('input:not([type=hidden]),textarea,select')].filter(vis).slice(0,20).map(e => {
				const o = { type: e.type || e.tagName.toLowerCase() };
				if (e.name) o.name = e.name;
				if (e.id) o.id = e.id;
				if (e.value) o.value = e.value.slice(0,100);
				if (e.placeholder) o.placeholder = e.placeholder;
				if (e.disabled) o.disabled = true;
				if (e.tagName === 'SELECT') o.options = [...e.options].map(o => o.text.slice(0,50));
				return o;
			});
			const seen = new Set();
			r.buttons = [...root.querySelectorAll('button,a[href],[role=button],[type=submit]')].filter(vis).slice(0,40).map(e => {
				const t = (e.textContent||'').trim().replace(/\\s+/g,' ').slice(0,60);
				if (!t || t.length < 2 || /^[.#{]/.test(t)) return null;
				const key = t + (e.getAttribute('href')||'');
				if (seen.has(key)) return null;
				seen.add(key);
				const o = { text: t };
				if (e.tagName === 'A' && e.href) o.href = e.getAttribute('href');
				if (e.id) o.id = e.id;
				if (e.type === 'submit') o.submit = true;
				return o;
			}).filter(Boolean).slice(0,25);
			r.headings = [...root.querySelectorAll('h1,h2,h3')].filter(vis).slice(0,10).map(e => e.textContent.trim().replace(/\\s+/g,' ').slice(0,80));
			const errs = [...root.querySelectorAll('[class*=error],[class*=alert],[role=alert],.toast,.notification')].filter(vis);
			r.errors = errs.slice(0,5).map(e => e.textContent.trim().replace(/\\s+/g,' ').slice(0,120)).filter(Boolean);
			return r;
		})()`;
		const data = await api("POST", `/tabs/${id}/execute`, { script, ...shotOpts() });
		const result = unwrap(data);
		if (flags.json) return console.log(JSON.stringify(result, null, 2));
		if (result.error) { console.error(`✗ ${result.error}`); Deno.exit(1); }
		// Pretty print
		console.log(`${result.url}`);
		console.log(`  ${result.title}`);
		if (result.scroll) {
			const s = result.scroll;
			const scrollable = s.pageH > s.viewH;
			const pct = scrollable ? Math.round((s.y / (s.pageH - s.viewH)) * 100) : 0;
			console.log(`  ${s.pageW}×${s.pageH}${scrollable ? ` scroll: ${pct}% (${s.y}/${s.pageH - s.viewH}px)` : ' (fits viewport)'}`);
		}
		if (result.headings?.length) console.log(`  headings: ${result.headings.join(' | ')}`);
		if (result.errors?.length) for (const e of result.errors) console.log(`  ⚠ ${e}`);
		if (result.inputs?.length) {
			console.log(`  inputs (${result.inputs.length}):`);
			for (const i of result.inputs)
				console.log(`    ${i.type}${i.name ? ' name=' + i.name : ''}${i.id ? ' id=' + i.id : ''}${i.value ? ' val="' + i.value + '"' : ''}${i.placeholder ? ' placeholder="' + i.placeholder + '"' : ''}`);
		}
		if (result.buttons?.length) {
			console.log(`  buttons (${result.buttons.length}):`);
			for (const b of result.buttons) {
				let href = b.href || '';
				// Truncate long URLs but keep the path readable
				if (href.length > 80) {
					try {
						const u = new URL(href, result.url);
						href = u.pathname + (u.search ? '?…' : '');
					} catch { href = href.slice(0, 80) + '…'; }
				}
				console.log(`    "${b.text}"${b.id ? ' id=' + b.id : ''}${href ? ' → ' + href : ''}${b.submit ? ' [submit]' : ''}`);
			}
		}
		if (flags.shot) { const p = saveShot(data, "observe"); if (p) console.log(fileUrl(p)); }
		printEvents(data);
		return;
	}

	case "assert": {
		const [kind, ...rest] = pos;
		const value = rest.join(" ");
		if (!kind || !value) throw new Error("Usage: assert text|selector|url|title <value>");
		const id = await activeTab(flags.tab);
		let script;
		switch (kind) {
			case "text":
				script = `document.body.innerText.includes(${JSON.stringify(value)})`; break;
			case "selector":
				script = `document.querySelector(${JSON.stringify(value)}) !== null`; break;
			case "url":
				script = `location.href.includes(${JSON.stringify(value)})`; break;
			case "title":
				script = `document.title.includes(${JSON.stringify(value)})`; break;
			default:
				throw new Error(`Unknown assert kind: ${kind}. Use: text|selector|url|title`);
		}
		const data = await api("POST", `/tabs/${id}/execute`, { script });
		const pass = unwrap(data);
		if (pass) {
			console.log(`✓ PASS: ${kind} matches "${value}"`);
		} else {
			// Give context on failure
			let actual = "";
			if (kind === "text") {
				const textData = await api("POST", `/tabs/${id}/text`, {});
				actual = (textData?.text || unwrap(textData) || "").slice(0, 300);
			} else if (kind === "url") {
				actual = unwrap(await api("POST", `/tabs/${id}/execute`, { script: "location.href" }));
			} else if (kind === "title") {
				actual = unwrap(await api("POST", `/tabs/${id}/execute`, { script: "document.title" }));
			} else if (kind === "selector") {
				actual = "(element not found)";
			}
			console.log(`✗ FAIL: ${kind} does not match "${value}"`);
			if (actual) console.log(`  actual: ${actual}`);
			Deno.exit(1);
		}
		return;
	}

	case "watch": {
		const timeout = Number(flags.timeout) || 10000;
		const interval = Number(flags.interval) || 500;
		const id = await activeTab(flags.tab);

		let script;
		if (flags.text) {
			script = `document.body.innerText.includes(${JSON.stringify(flags.text)})`;
		} else if (flags.selector) {
			script = `document.querySelector(${JSON.stringify(flags.selector)}) !== null`;
		} else if (flags.url) {
			script = `location.href.includes(${JSON.stringify(flags.url)})`;
		} else if (flags.eval) {
			script = flags.eval;
		} else {
			throw new Error("Usage: watch --text|--selector|--url|--eval <expr> [--timeout ms] [--interval ms]");
		}

		// Resume JS so the page can update
		try { await api("POST", `/tabs/${id}/execution`, { paused: false }); } catch {}

		const start = Date.now();
		while (Date.now() - start < timeout) {
			try {
				const data = await api("POST", `/tabs/${id}/execute`, { script });
				if (unwrap(data)) {
					// Re-pause and settle
					try { await api("POST", `/tabs/${id}/execution`, { paused: true }); } catch {}
					try { await api("POST", `/tabs/${id}/wait_for_network`, {}); } catch {}
					console.log(`✓ matched after ${Date.now() - start}ms`);
					// Take screenshot if --shot
					if (flags.shot || flags.markup) {
						const shotData = await api("POST", `/tabs/${id}/screenshot`, {
							screenshot: { format: flags.format || "webp", markup: flags.markup === "none" ? [] : flags.markup ? flags.markup.split(",") : "interactive" }
						});
						const p = saveShot(shotData, "watch");
						if (p) console.log(fileUrl(p));
					}
					return;
				}
			} catch { /* page might be navigating */ }
			await new Promise(r => setTimeout(r, interval));
		}

		// Timeout — re-pause and report
		try { await api("POST", `/tabs/${id}/execution`, { paused: true }); } catch {}
		console.log(`✗ timeout after ${timeout}ms`);
		Deno.exit(1);
	}

	// ═══ Wait ═══

	case "wait": {
		const ms = Number(pos[0]);
		if (isNaN(ms)) throw new Error("Usage: wait <ms>");
		const id = await activeTab(flags.tab);
		out(await api("POST", `/tabs/${id}/wait`, { ms, ...shotOpts() }), "wait");
		console.log(`✓ ${ms}ms`);
		return;
	}

	case "network": {
		const id = await activeTab(flags.tab);
		out(await api("POST", `/tabs/${id}/wait_for_network`, shotOpts()), "network");
		console.log("✓ network settled");
		return;
	}

	case "console": {
		// Inject console capture, execute JS, collect logs
		const id = await activeTab(flags.tab);
		const install = `(() => {
			if (window.__abpConsole) return 'already installed';
			window.__abpConsole = [];
			const orig = {};
			for (const m of ['log','warn','error','info','debug']) {
				orig[m] = console[m];
				console[m] = (...args) => {
					window.__abpConsole.push({ level: m, ts: Date.now(), args: args.map(a => {
						try { return typeof a === 'object' ? JSON.stringify(a) : String(a); } catch { return String(a); }
					})});
					orig[m].apply(console, args);
				};
			}
			window.addEventListener('error', e => window.__abpConsole.push({ level: 'exception', ts: Date.now(), args: [e.message, e.filename + ':' + e.lineno] }));
			window.addEventListener('unhandledrejection', e => window.__abpConsole.push({ level: 'rejection', ts: Date.now(), args: [String(e.reason)] }));
			return 'installed';
		})()`;
		const drain = `(() => {
			if (!window.__abpConsole) return '[]';
			const logs = JSON.stringify(window.__abpConsole);
			window.__abpConsole = [];
			return logs;
		})()`;

		const [action = "drain"] = pos;
		if (action === "install") {
			const r = unwrap(await api("POST", `/tabs/${id}/execute`, { script: install }));
			console.log(`✓ console capture ${r}`);
		} else if (action === "drain") {
			const r = unwrap(await api("POST", `/tabs/${id}/execute`, { script: drain }));
			const logs = JSON.parse(r || "[]");
			if (!logs.length) return console.log("(no console output)");
			for (const l of logs) {
				const icon = { error: "✗", warn: "⚠", exception: "💥", rejection: "💥" }[l.level] || "·";
				console.log(`${icon} [${l.level}] ${l.args.join(" ")}`);
			}
		} else if (action === "clear") {
			await api("POST", `/tabs/${id}/execute`, { script: "window.__abpConsole = []" });
			console.log("✓ cleared");
		} else throw new Error("Usage: console [install|drain|clear]");
		return;
	}

	case "session-data": {
		console.log(JSON.stringify(await api("GET", "/browser/session-data"), null, 2));
		return;
	}

	// ═══ Execution Control ═══

	case "execution": {
		const [action = "status"] = pos;
		const id = await activeTab(flags.tab);
		if (action === "status") console.log(JSON.stringify(await api("GET", `/tabs/${id}/execution`), null, 2));
		else if (action === "pause") { await api("POST", `/tabs/${id}/execution`, { paused: true }); console.log("✓ paused"); }
		else if (action === "resume") { await api("POST", `/tabs/${id}/execution`, { paused: false }); console.log("✓ resumed"); }
		else throw new Error(`Unknown: execution ${action}`);
		return;
	}

	// ═══ Permissions ═══

	case "permission": {
		const [action = "list"] = pos;
		if (action === "list") return console.log(JSON.stringify(await api("GET", "/permissions"), null, 2));
		if (action === "grant") {
			const body = {};
			if (flags.lat && flags.lng) body.geolocation = { latitude: Number(flags.lat), longitude: Number(flags.lng) };
			await api("POST", `/permissions/${pos[1]}/grant`, body); console.log("✓ granted");
		} else if (action === "deny") {
			await api("POST", `/permissions/${pos[1]}/deny`); console.log("✓ denied");
		} else throw new Error(`Unknown: permission ${action}`);
		return;
	}

	// ═══ Batch ═══

	case "batch": {
		const json = pos.join(" ");
		if (!json) throw new Error('Usage: batch \'[{"type":"mouse_click","x":100,"y":200},{"type":"keyboard_type","text":"hi"}]\'');
		const actions = JSON.parse(json);
		const id = await activeTab(flags.tab);
		out(await api("POST", `/tabs/${id}/batch`, { actions, ...shotOpts() }), "batch");
		console.log(`✓ ${actions.length} actions`);
		return;
	}

	// ═══ History ═══

	case "history": {
		const [action = "sessions", arg] = pos;
		if (action === "sessions") return console.log(JSON.stringify(await api("GET", "/history/sessions"), null, 2));
		if (action === "current") return console.log(JSON.stringify(await api("GET", "/history/sessions/current"), null, 2));
		if (action === "session" && arg) return console.log(JSON.stringify(await api("GET", `/history/sessions/${arg}`), null, 2));
		if (action === "export" && arg) return console.log(JSON.stringify(await api("GET", `/history/sessions/${arg}/export`), null, 2));
		if (action === "actions") return console.log(JSON.stringify(await api("GET", "/history/actions"), null, 2));
		if (action === "action" && arg) return console.log(JSON.stringify(await api("GET", `/history/actions/${arg}`), null, 2));
		if (action === "events") return console.log(JSON.stringify(await api("GET", "/history/events"), null, 2));
		if (action === "event" && arg) return console.log(JSON.stringify(await api("GET", `/history/events/${arg}`), null, 2));
		if (action === "clear") { await api("DELETE", "/history"); console.log("✓ cleared"); return; }
		throw new Error(`Unknown: history ${action}${arg ? " " + arg : ""}`);
	}

	// ═══ Help ═══

	default:
		console.log(`ABP Browser CLI — full Agent Browser Protocol access
Port: ${PORT} (from ${flags.port ? "--port flag" : Deno.env.get("ABP_PORT") ? "ABP_PORT env" : `hash of ${projectRoot()}`})

BROWSE
  nav <url> [--new]          Navigate (--new for new tab)
  back | forward | reload    History navigation
  screenshot                 Capture viewport
  fullpage                   Full-page screenshot (scroll + stitch, pure Deno)
  text [selector]            Visible text (API, fast)
  content [url]              Article as Markdown (Readability)
  eval '<code>'              Execute JavaScript
  cookies                    View non-HttpOnly cookies

MOUSE
  click <x> <y>              Click [--right] [--double] [--mod CTRL,SHIFT]
  hover <x> <y>              Move mouse
  scroll <x> <y> --dy N      Mouse wheel [--dx N]
  drag <x1> <y1> <x2> <y2>   Drag [--steps N]

KEYBOARD
  type <text>                Type string
  key <KEY>                  Press key [--mod CTRL,SHIFT] [--action down|up]
                             Keys: ENTER TAB ESCAPE BACKSPACE ARROWUP ARROWDOWN
                                   ARROWLEFT ARROWRIGHT DELETE HOME END PAGEUP PAGEDOWN

SMART
  observe                    Structured page snapshot (URL, title, inputs, buttons, errors)
  assert text|selector|url|title <val>  Pass/fail check — exit 1 on failure
  watch --text|--selector|--url|--eval <val> [--timeout ms]  Poll until condition met

HELPERS
  slider <x> <y> <value>     Set range input
  clear <x> <y>              Clear text field (click+select all+delete)
  pick [message]             Interactive element picker (user clicks in browser)
  wait <ms>                  Wait duration
  network                    Wait for pending network requests to settle
  batch '<json>'             Multiple actions in one call

DEEP ACCESS
  console install            Inject console/error/rejection capture into page
  console drain              Retrieve captured console logs (then clear buffer)
  console clear              Clear captured logs
  eval '<js>'                Execute any JS in page context (full DOM/API access)

TABS
  tabs                       List all tabs
  tabs new [url]             New tab
  tabs close|activate|info|stop <id>

EVENTS
  dialog [check|accept|dismiss]      JS dialogs (alert/confirm/prompt)
  download [list|status|cancel|get]  Downloads [--state X] [--limit N] [--max-size N]
  file <id> <paths...>               File chooser [--cancel] [--save path]
  select <id> <index>                Native <select> dropdown
  permission [list|grant|deny]       Permissions [--lat N --lng N]

CONTROL
  start                      Launch ABP (auto-port per project)
  port                       Show resolved port
  status                     Browser status
  session-data               Session directory & database paths
  shutdown                   Graceful shutdown [--timeout ms]
  execution [status|pause|resume]  JS execution & virtual time

HISTORY
  history [sessions]                 List sessions
  history current                    Current session
  history session <id>               Session details
  history export <id>                Export session data
  history actions                    Action log
  history action <id>                Single action detail
  history events                     Browser events log
  history event <id>                 Single event detail
  history clear                      Delete all history

START FLAGS (passed to ABP on launch)
  --headless                 No visible window
  --verbose                  Pipe browser output to stderr
  --user-data-dir <path>     Chrome profile data directory
  --profile-directory <name> Chrome profile name
  --user-agent <string>      Custom User-Agent
  --zoom <factor>            Zoom level (default: 1.0)
  --min-wait <ms>            Pre-network settlement (default: 150)
  --tracking-timeout <ms>    Network request tracking timeout (default: 1000)
  --post-settle <ms>         Post-network settle time (default: 350)
  --disable-pause            Don't freeze JS between actions
  --config-file <path>       ABP JSON config file
  --session-dir <path>       Session data directory
  --chrome-args <a,b,c>      Extra Chrome flags (comma-separated)

GLOBAL FLAGS (any command)
  --tab <id>       Target specific tab (default: active)
  --port <N>       Override port (default: auto per project)
  --shot           Include screenshot in response
  --markup <X>     interactive | clickable,typeable,scrollable,grid,selected | none
  --format <X>     webp (default) | png | jpeg
  --json           Raw JSON response

PORT RESOLUTION (no config needed)
  Auto-derives a unique port per project from git root path (9222-19221).
  Override: --port <N> (any command) or ABP_PORT env var.`);
	}
}

run().catch((e) => { console.error(`✗ ${e.message}`); Deno.exit(1); });
