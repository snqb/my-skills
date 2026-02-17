# Web Application Testing Skill

**Philosophy:** Always use Vibium MCP tools. Only use Playwright if Vibium literally cannot do what you need (rare).

## Quick Start

**Visual verification (after any UI change):**
```
1. mcp__vibium__browser_launch
2. mcp__vibium__browser_navigate → http://localhost:3000
3. mcp__vibium__browser_screenshot
4. Show user
5. mcp__vibium__browser_quit
```

**Interactive testing:**
```
- Click: mcp__vibium__browser_click (selector)
- Type: mcp__vibium__browser_type (selector, text)
- Find: mcp__vibium__browser_find (selector)
- Screenshot: mcp__vibium__browser_screenshot
```

## When to Use What

### ✅ Vibium (95% of cases)
- Visual verification
- Click buttons, links
- Fill forms
- Take screenshots
- Multi-page flows
- Basic element inspection
- Console logs, network requests

### ⚠️ Playwright (rare, only if Vibium can't)
- Complex programmatic logic
- Advanced network mocking
- Custom JS evaluation beyond Vibium
- Server lifecycle management (use `with_server.py`)

## Available Tools

All Vibium MCP browser tools:
- `browser_launch` / `browser_quit`
- `browser_navigate` / `browser_navigate_back` / `browser_navigate_forward`
- `browser_click` / `browser_type`
- `browser_find` / `browser_wait_for`
- `browser_screenshot`
- `browser_console_messages` / `browser_network_requests`
- `browser_handle_dialog`
- Tab management, resizing, etc.

## Helper Scripts (Playwright)

If you must use Playwright:
- `scripts/with_server.py` - Manages dev servers
- `examples/` - Example patterns

Run `python scripts/with_server.py --help` for usage.

## Key Rules

1. **Default to Vibium** for all browser tasks
2. **Always screenshot** after UI changes
3. **Show the screenshot** to user (no asking)
4. **Close browser** when done
5. **Use Playwright** only when Vibium cannot do it

## Why This Approach

- **Simpler:** Vibium MCP tools vs writing Playwright scripts
- **KISS:** One tool for 95% of cases
- **Reliable:** Built by Selenium creator for AI agents
- **Fast:** No script writing, just direct tool calls

**Changed from:** Complex decision tree (static HTML? server running? reconnaissance?)
**Changed to:** Always Vibium. Playwright only if necessary.
