---
name: browser-testing
description: "Full browser automation via Agent Browser Protocol (ABP). Navigate, click, type, scroll, drag, screenshot, extract text, handle dialogs/downloads/file pickers, manage tabs, control JS execution. Single CLI tool."
---

# Browser Automation — ABP

Single tool: `{baseDir}/browser.js <command> [args] [--flags]`

ABP is a Chromium fork with a REST API baked into the engine. Every action is atomic — JS freezes between steps, no race conditions, no manual waits.

## How ABP Works (Execution Model)

ABP **pauses JavaScript and virtual time** between your actions. The page is frozen until the next command.

Each action triggers a 3-phase settle cycle:
1. **Pre-network wait** (150ms) — JS fires handlers from your action
2. **Network tracking** — waits for triggered requests to complete (up to 1s timeout)
3. **Post-settle** (350ms) — DOM stabilizes after network responses

One command = resume → dispatch action → settle → screenshot (if requested) → re-pause.

This means: no `sleep()` hacks, no race conditions, no flaky selectors. If a click triggers an API call, ABP waits for it automatically.

## Setup

```bash
{baseDir}/browser.js start           # Launch ABP (auto-port per project)
{baseDir}/browser.js port            # Show resolved port
```

## Port Management

Each project gets its own ABP instance automatically — no config needed.

Port is derived deterministically from git root path → range 9222–19221.
Same project = same port. Different project = different port.

Override: `--port 8222` (any command) or `ABP_PORT=8222` env var.

## Launch Options

All flags below apply to `start` and are forwarded to ABP:

```bash
B={baseDir}/browser.js

$B start --headless                  # No visible window
$B start --user-data-dir /tmp/prof   # Chrome profile directory
$B start --profile-directory Default # Profile name within user-data-dir
$B start --user-agent "MyBot/1.0"    # Custom User-Agent
$B start --zoom 1.5                  # Zoom level
$B start --verbose                   # Pipe browser output to stderr
$B start --session-dir ./my-session  # Session data directory
$B start --config-file ./abp.json    # ABP JSON config
$B start --disable-pause             # Don't freeze JS between actions

# Settlement tuning (for slow apps)
$B start --min-wait 500              # Pre-network wait (default: 150ms)
$B start --tracking-timeout 3000     # Network tracking timeout (default: 1000ms)
$B start --post-settle 1000          # Post-network settle (default: 350ms)

# Pass Chrome flags
$B start --chrome-args --disable-gpu,--no-sandbox
```

## Core Commands

```bash
B={baseDir}/browser.js

# Navigate
$B nav https://example.com           # Navigate active tab
$B nav https://other.com --new       # New tab
$B back                              # History back
$B forward                           # History forward
$B reload                            # Reload

# Mouse
$B click 450 320                     # Left click
$B click 450 320 --right             # Right click
$B click 450 320 --double            # Double click
$B click 450 320 --mod CTRL          # Ctrl+click
$B hover 300 200                     # Mouse move (trigger tooltips/menus)
$B scroll 640 400 --dy 500           # Scroll down 500px
$B scroll 640 400 --dy -300          # Scroll up
$B scroll 640 400 --dx 200           # Scroll right
$B drag 100 200 500 200              # Drag from→to
$B drag 100 200 500 200 --steps 20   # Smooth drag

# Keyboard
$B type hello world                  # Type text
$B key ENTER                         # Press key
$B key TAB                           # Tab
$B key ESCAPE                        # Escape
$B key a --mod CTRL                  # Ctrl+A (select all)
$B key c --mod CTRL                  # Ctrl+C (copy)
$B key ARROWDOWN                     # Arrow keys
$B key BACKSPACE
$B key a --mod CTRL --action down    # Key down only (hold)
$B key a --action up                 # Key up (release)

# Input helpers
$B slider 400 300 75                 # Set range input to 75
$B clear 400 300                     # Clear text field (click + select all + delete)
$B pick "Select the login button"    # Interactive: user clicks element in browser

# Observe / Assert / Watch (prefer these — low token cost)
$B observe                           # Structured page snapshot (~150 tokens)
$B observe "form"                    # Scoped to CSS selector (~50 tokens)
$B observe --shot                    # Structured data + screenshot in one call
$B assert text "Welcome"             # Pass/fail text check (~20 tokens)
$B assert selector "#dashboard"      # Element exists?
$B assert url "/dashboard"           # URL contains?
$B assert title "Dashboard"          # Title contains?
$B watch --text "Done" --timeout 30000   # Wait for async result
$B watch --selector ".loaded"        # Wait for element to appear
$B watch --eval "items.length > 5"   # Wait for JS condition
$B watch --text "Done" --shot        # Wait + screenshot on match

# Screenshot (only when you need to see layout/visuals)
$B screenshot                        # Viewport with interactive markup
$B fullpage                          # Full-page screenshot (scroll + stitch, requires ImageMagick)
$B screenshot --markup clickable     # Only clickable elements highlighted
$B screenshot --markup typeable      # Only input fields highlighted
$B screenshot --markup none          # Clean, no overlays
$B screenshot --format png           # PNG instead of WebP

# Extract content
$B text                              # All visible text (fast, API-native)
$B text "h1.title"                   # Text within CSS selector
$B eval 'document.title'             # Execute JavaScript
$B eval '({links: document.querySelectorAll("a").length})'
$B content                           # Current page as Markdown (Readability)
$B content https://example.com       # Navigate + extract as Markdown
$B cookies                           # Non-HttpOnly cookies
```

## Waiting & Network

```bash
$B wait 2000                         # Wait 2s (resumes JS during wait)
$B network                           # Wait for pending network requests to settle
```

`network` is useful after actions that trigger slow API calls — when the 1s default tracking timeout isn't enough. It re-runs the settle cycle without performing any action.

## Console & Error Capture

ABP doesn't expose DevTools console natively, but you can inject capture:

```bash
$B console install                   # Inject console.log/warn/error/info/debug capture
$B console drain                     # Retrieve all captured logs (clears buffer)
$B console clear                     # Clear buffer without reading

# Output format:
# · [log] User loaded profile
# ⚠ [warn] Deprecated API call
# ✗ [error] Failed to fetch /api/data
# 💥 [exception] TypeError: Cannot read property 'x' of null at app.js:42
# 💥 [rejection] Unhandled promise rejection: NetworkError
```

Install once after navigation, then drain periodically. Captures `console.*`, uncaught exceptions, and unhandled promise rejections.

## Deep Browser Access via `eval`

`eval` gives full access to the page's JS context — any Web API, any DOM operation:

```bash
# DOM inspection
$B eval 'document.querySelectorAll("form").length'
$B eval 'document.querySelector("#app").__vue__'          # Vue internals
$B eval 'document.querySelector("#root")._reactRootContainer'  # React fiber

# localStorage / sessionStorage
$B eval 'JSON.stringify(Object.fromEntries(Object.entries(localStorage)))'
$B eval 'sessionStorage.getItem("auth_token")'

# Service Workers
$B eval 'navigator.serviceWorker.getRegistrations().then(r => r.map(sw => sw.scope))'

# IndexedDB databases
$B eval 'indexedDB.databases().then(dbs => dbs.map(d => d.name))'

# Geolocation (mock via permission grant, or query)
$B eval 'new Promise(r => navigator.geolocation.getCurrentPosition(p => r(p.coords)))'

# Clipboard
$B eval 'navigator.clipboard.readText()'

# Page visibility / focus
$B eval '({ hidden: document.hidden, focused: document.hasFocus(), visibility: document.visibilityState })'

# Computed styles
$B eval 'getComputedStyle(document.querySelector(".btn")).backgroundColor'

# Accessibility tree
$B eval 'document.querySelector("main").getAttribute("role")'
```

**Gotcha**: `eval` uses global scope — `const`/`let` redeclarations fail on second call. Wrap in IIFE: `(() => { ... })()`

## Network Analysis

Use `performance.getEntriesByType('resource')` via eval to audit network requests after page load. Navigate, wait 5-8s for hydration, then eval.

```bash
# Count requests by category
$B eval "
(() => {
  const e = performance.getEntriesByType('resource');
  const apis = e.filter(r => r.name.includes('/api/'));
  return 'total=' + e.length + ' api=' + apis.length + '\\n' +
    apis.map(r => r.name.replace(/https?:\/\/[^/]+/,'').split('?')[0] +
    ' ' + Math.round(r.duration) + 'ms ' + (r.transferSize||0) + 'B').join('\\n');
})()
"

# Full breakdown by type
$B eval "
(() => {
  const e = performance.getEntriesByType('resource');
  const c = {};
  for (const r of e) {
    const u = r.name;
    let k = 'other';
    if (u.includes('/api/')) k = 'API';
    else if (u.includes('.js')) k = 'JS';
    else if (u.includes('.css')) k = 'CSS';
    else if (u.match(/\.(png|jpg|webp|svg|gif)/)) k = 'Images';
    else if (u.includes('.woff')) k = 'Fonts';
    if (!c[k]) c[k] = [0, 0];
    c[k][0]++;
    c[k][1] += r.transferSize || 0;
  }
  return JSON.stringify(c);
})()
"

# Monitor XHR/fetch in real-time (inject, then drain)
$B eval "
(() => {
  if (window.__abpNet) return 'already installed';
  window.__abpNet = [];
  const origFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '?';
    const method = args[1]?.method || 'GET';
    const start = Date.now();
    try {
      const r = await origFetch(...args);
      window.__abpNet.push({ url, method, status: r.status, ms: Date.now()-start });
      return r;
    } catch(e) {
      window.__abpNet.push({ url, method, error: e.message, ms: Date.now()-start });
      throw e;
    }
  };
  return 'installed';
})()
"

# Drain captured fetch calls
$B eval "(() => { const n = window.__abpNet || []; window.__abpNet = []; return JSON.stringify(n); })()"
```

Common gotchas:
- `transferSize=0` means cache hit (CF, browser, or service worker)
- Resources appear incrementally — wait 5-8s after nav before eval
- `performance.getEntriesByType` has a 150-entry default buffer — large pages may truncate

## Tabs

```bash
$B tabs                              # List all tabs
$B tabs new https://google.com       # New tab with URL
$B tabs activate <id>                # Switch to tab
$B tabs close <id>                   # Close tab
$B tabs info <id>                    # Tab details
$B tabs stop <id>                    # Stop loading
```

## Browser Events

ABP surfaces events that normally require polling — dialogs, file pickers, downloads, select dropdowns, permission prompts. They appear in the output of any action.

```bash
# Dialogs (alert, confirm, prompt)
$B dialog                            # Check for pending dialog
$B dialog accept                     # Accept
$B dialog accept "response text"     # Accept prompt with text
$B dialog dismiss                    # Dismiss/cancel

# Downloads
$B download                          # List all
$B download list --state completed   # Filter by state
$B download list --limit 5           # Limit results
$B download status <id>              # Check progress
$B download cancel <id>              # Cancel
$B download get <id>                 # Get content (base64)
$B download get <id> --max-size 1048576  # Limit content size

# File chooser (triggered by file input click)
$B file <chooser_id> /path/to/file.pdf       # Upload file
$B file <chooser_id> file1.jpg file2.jpg     # Multiple files
$B file <chooser_id> --cancel                # Cancel picker
$B file <chooser_id> --save /path/out.pdf    # Save dialog

# Native <select> dropdown
$B select <select_id> 2              # Choose option at index

# Permissions (geolocation, camera, etc.)
$B permission                         # List pending
$B permission grant <id>              # Grant
$B permission grant <id> --lat 42.36 --lng -71.06  # Grant geo with coords
$B permission deny <id>               # Deny
```

## Event Indicators

When events occur during any action, they're printed automatically:

```
  → https://new-page.com              # Navigation happened
  ⚠ dialog (confirm): Delete item?    # Dialog appeared
  📁 file chooser id=fc_1             # File picker opened
  ⬇ download: report.pdf              # Download started
  ▾ select id=s_1 (5 options)         # Native select opened
  🔐 permission id=p_1 geolocation    # Permission requested
  ↗ popup: https://popup.com          # Popup window
```

## Execution Control

ABP freezes JS between actions by default. You can control this:

```bash
$B execution                          # Current state
$B execution pause                    # Freeze JS & virtual time
$B execution resume                   # Unfreeze
```

## Session & History

```bash
# Session info
$B session-data                       # Session directory & database paths
$B status                             # Browser readiness

# History (SQLite-backed)
$B history                            # List sessions
$B history current                    # Current session
$B history session <id>               # Session details
$B history export <id>                # Export full session data
$B history actions                    # Action log
$B history action <id>                # Single action detail
$B history events                     # Browser events log
$B history event <id>                 # Single event detail
$B history clear                      # Delete all

# Debug server (separate tool)
npx abp-debug                        # Web UI on :8223 — action timeline, screenshots, live updates
```

## Advanced

```bash
# Batch: multiple actions, one screenshot
$B batch '[{"type":"mouse_click","x":350,"y":200},{"type":"keyboard_type","text":"hello"},{"type":"keyboard_press","key":"ENTER"}]'

# Lifecycle
$B shutdown                           # Graceful shutdown
$B shutdown --timeout 10000           # Custom timeout
```

## Global Flags

| Flag | Description |
|---|---|
| `--tab <id>` | Target specific tab (default: active) |
| `--port <N>` | Override port (default: auto per project) |
| `--shot` | Save screenshot after action (prints path) |
| `--markup <types>` | Screenshot markup: `interactive`, `clickable,typeable,scrollable,grid,selected`, or `none` |
| `--format <fmt>` | Screenshot format: `webp` (default), `png`, `jpeg` |
| `--json` | Output raw API response as JSON |

## Speed Rules

### Token Cost Per Command

| Command | ~Tokens | Use when |
|---------|---------|----------|
| `eval` | 30–50 | Check DOM state, extract data, verify actions |
| `assert` | 20–30 | Pass/fail check (text, selector, URL) |
| `text` | 200–800 | Read visible page text |
| `observe` | 150–250 | Structured page snapshot (what's interactive) |
| `screenshot` | ~1500 | Need to see layout/visuals |
| `content` | 500–3000 | Full article extraction |

### What To Use When (Decision Tree)

```
"Am I on the right page?"     → eval 'location.href'  or  eval 'document.title'
"What can I interact with?"   → observe
"Did my action work?"         → eval (check DOM/URL state)  or  assert
"What data is on the page?"   → text  or  eval
"What does it look like?"     → screenshot
"I'm lost / complex layout"   → screenshot
"Waiting for async result"    → watch --text "..." --timeout 30000
```

**Default to eval/text/observe. Escalate to screenshot only when layout matters.**

### Observe — Structured Page Snapshot (~150 tokens)

Use `observe` instead of `screenshot` when you need to know what's on the page but don't need to *see* it:

```bash
$B observe               # → url, title, headings, inputs, buttons, errors
$B observe "form"        # Scoped to a CSS selector (~50 tokens)
$B observe ".modal"      # Just the modal content
$B observe --shot        # Structured data + screenshot in one call
$B observe --json        # Raw JSON output
```

Returns: URL, title, visible interactive elements (inputs with names/values/placeholders, buttons with text/hrefs), headings, and error messages. Only visible elements — hidden inputs and off-screen elements are filtered out. Enough to decide next action without vision.

### Assert — Pass/Fail Verification (~20 tokens)

After actions, verify without vision:

```bash
$B assert text "Welcome back"        # Page contains text?
$B assert selector "#dashboard"      # Element exists?
$B assert url "/dashboard"           # URL contains string?
$B assert title "Dashboard"          # Title matches?
```

Returns `✓ PASS` or `✗ FAIL: <context>`. Zero tokens on happy path.

### Watch — Wait For Async UI (~20 tokens)

Don't write polling loops. One command, one result:

```bash
$B watch --text "Payment complete" --timeout 30000
$B watch --selector ".loaded" --timeout 5000
$B watch --url "/success" --timeout 10000
$B watch --eval "document.querySelectorAll('.item').length >= 10" --timeout 5000
```

Resumes JS, polls internally, returns when matched or timed out.

### Core Speed Rules

1. **Start ABP first**: `browser.js start`
2. **Don't screenshot every step**: Only screenshot when you need to see layout/visuals.
3. **Use `observe` as default awareness**: After nav or complex actions, `observe` gives page state in ~150 tokens vs ~1500 for a screenshot.
4. **Use `assert` for verification**: After form submission, `assert text "Success"` — not screenshot + read.
5. **Observe the URL after search**: Most SPAs encode filters in URL params. Copy it, modify it, `nav` directly next time.
6. **Extract data via `eval`, not vision**: One JS query extracts 10 results faster than scrolling + screenshotting.
7. **Batch related inputs**: Click + type + Enter = one `batch` call instead of three.
8. **Use `text` for simple data**: `text` is faster than `eval` for plain text extraction.
9. **Use `watch` instead of polling loops**: When waiting for loading/async results.
10. **Use `network` for slow pages**: After nav to an SPA, `network` waits for all pending XHR/fetch to complete.
11. **Use pick for ambiguity**: When coordinates are unclear, let the user click.

### Anti-Pattern

```
click → screenshot → read image → decide → click → screenshot → ...
(each step: ~3s for screenshot + LLM vision round-trip)
```

### Fast Patterns

**Blind execution** (known flow):
```bash
$B nav https://app.com
$B click 450 300          # login button
$B type user@example.com
$B key TAB
$B type mysecretpassword
$B key ENTER
$B assert text "Dashboard"   # verify once at the end
```

**Explore then act** (unknown page):
```bash
$B nav https://app.com
$B observe                # structured snapshot, 150 tokens
# Now you know what's on the page — act on it
$B click 450 300
$B assert url "/profile"
```

**Data extraction** (scraping):
```bash
$B nav https://shop.com/products
$B eval '([...document.querySelectorAll(".product")].map(e => ({name: e.querySelector("h2").textContent, price: e.querySelector(".price").textContent})))'
# One call, all data. No scrolling, no screenshots.
```

**Multi-page parallel** (compare/verify across pages):
```bash
$B nav https://app.com/page1 --new    # tab 1
$B nav https://app.com/page2 --new    # tab 2
$B nav https://app.com/page3 --new    # tab 3
# Work each tab independently via --tab <id>
# Merge results at the end
```

**Async wait** (payment, loading):
```bash
$B click 500 400                           # submit payment
$B watch --text "Payment confirmed" --timeout 30000   # wait, don't poll
$B screenshot                              # visual confirmation
```
