# Visual Testing Workflow - Default Behavior

**Purpose:** Guide Claude to proactively verify visual changes during normal development.

This is NOT the full design review process (that's `/design-review-ui`). This is for **quick visual verification** when making UI changes.

---

## Core Principle: See What You Built

**When making ANY UI change (HTML, CSS, React components, etc.), Claude MUST visually verify the result before reporting completion.**

### Decision Tree: When to Take Screenshots

```
Made a UI change?
  ↓
  Is it visible to users?
  ├─ YES → REQUIRED: Take screenshot + show user
  │   Examples:
  │   - Added/modified component
  │   - Changed styles/layout
  │   - Fixed visual bug
  │   - Updated UI text/content
  │
  └─ NO → Optional (only if helpful)
      Examples:
      - Backend API changes
      - Database migrations
      - Pure logic changes
```

---

## Three-Tier Verification Approach

### Tier 1: Quick Visual Check (Most Common)
**When:** Simple UI changes, bug fixes, component additions
**Time:** 10-30 seconds
**Process:**
1. Start dev server (or verify it's running)
2. Navigate to relevant page
3. Take screenshot
4. Show user with context: "Here's the button I added:"

**Example workflow:**
```bash
# 1. Start server (if needed)
npm run dev &  # or use with_server.py

# 2. Quick Playwright verification
python -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:3000/dashboard')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='/tmp/verify.png', full_page=True)
    browser.close()
"

# 3. Show screenshot to user
```

### Tier 2: Interactive Testing (Medium Complexity)
**When:** Interactive features, forms, multi-step flows
**Time:** 1-3 minutes
**Process:**
1. Navigate to page
2. Interact with elements (click, type, etc.)
3. Capture before/after states
4. Verify functionality + visual appearance

**Example: Form validation**
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:3000/signup')
    page.wait_for_load_state('networkidle')

    # Before state
    page.screenshot(path='/tmp/form_empty.png')

    # Interact
    page.fill('input[name="email"]', 'invalid-email')
    page.click('button[type="submit"]')
    page.wait_for_timeout(500)  # Wait for validation

    # After state
    page.screenshot(path='/tmp/form_error.png')

    browser.close()
```

### Tier 3: Full Design Review
**When:** Major UI overhauls, new features, pre-merge review
**Time:** 5-15 minutes
**Process:** Use `/design-review-ui` command

---

## ENFORCED: Use Vibium MCP Tools (Browser Automation)

**IMPORTANT:** Always use **Vibium MCP tools** (`mcp__vibium__*`) for visual verification. Vibium is built by the Selenium creator specifically for AI agents.

### Required Vibium Workflow
✅ **5-step process for ALL UI changes:**
1. **Launch browser:** `mcp__vibium__browser_launch`
2. **Navigate to page:** `mcp__vibium__browser_navigate(url="http://localhost:3000")`
3. **Take screenshot:** `mcp__vibium__browser_screenshot(path="/tmp/verify.png")`
4. **Show user:** Include screenshot in response
5. **Quit browser:** `mcp__vibium__browser_quit`

**Example:**
```
mcp__vibium__browser_launch
mcp__vibium__browser_navigate → http://localhost:3000
mcp__vibium__browser_screenshot → /tmp/verify.png
mcp__vibium__browser_quit
```

**Why Vibium:**
- Built by Selenium creator for AI agents
- MCP-native (no extra setup)
- Reliable, proven browser automation
- Required by Claude's configuration

### Vibium Tools Available
- `browser_launch` - Start browser
- `browser_navigate` - Go to URL
- `browser_find` - Find elements
- `browser_click` - Click element
- `browser_type` - Type text
- `browser_screenshot` - Capture screen
- `browser_quit` - Close browser

### Use Native Playwright Scripts ONLY When
❌ **Vibium tools are insufficient for:**
- Complex multi-step flows requiring loops/conditionals
- Server lifecycle management (use `with_server.py`)
- Advanced element discovery patterns

**In these cases:** Write native Playwright scripts, but still show screenshots using Vibium after.

**Pros Vibium:** MCP-native, reliable, enforced by config
**Pros Playwright:** More flexible for complex scenarios

---

## Screenshot Best Practices

### 1. Always Provide Context
❌ **Bad:**
```
"Screenshot saved to /tmp/verify.png"
```

✅ **Good:**
```
"Added the delete button to the user card. Here's how it looks:
[Screenshot]

The button appears on hover with red styling as requested."
```

### 2. Capture Relevant States
**For interactive elements:**
- Default state
- Hover state (if CSS changes)
- Active/clicked state
- Error/disabled state

**Example:**
```python
# Capture button states
page.screenshot(path='/tmp/button_default.png')

page.hover('button.delete')
page.screenshot(path='/tmp/button_hover.png')

page.click('button.delete')
page.wait_for_selector('.confirm-dialog')
page.screenshot(path='/tmp/confirm_dialog.png')
```

### 3. Use Full Page vs. Element Screenshots

**Full page:** Layout changes, responsive design
```python
page.screenshot(path='/tmp/full.png', full_page=True)
```

**Element only:** Specific component focus
```python
element = page.locator('.user-card')
element.screenshot(path='/tmp/card.png')
```

### 4. Responsive Verification (If Relevant)

**For layout-sensitive changes:**
```python
# Desktop
page.set_viewport_size({"width": 1440, "height": 900})
page.screenshot(path='/tmp/desktop.png')

# Mobile
page.set_viewport_size({"width": 375, "height": 667})
page.screenshot(path='/tmp/mobile.png')
```

---

## Common Workflows

### Workflow 1: Added New Component
```
1. User: "Add a user profile card to the dashboard"
2. Claude: Writes component code
3. Claude: Starts dev server (if needed)
4. Claude: Takes screenshot of dashboard with new card
5. Claude: Shows user: "Added user profile card. Here's the result:"
   [Screenshot]
```

### Workflow 2: Fixed Visual Bug
```
1. User: "The button text is cut off on mobile"
2. Claude: Identifies issue, fixes CSS
3. Claude: Takes before/after screenshots (mobile viewport)
4. Claude: Shows user:
   "Fixed text overflow. Before vs After:"
   [Before screenshot] [After screenshot]
```

### Workflow 3: Styling Changes
```
1. User: "Make the header sticky and add shadow on scroll"
2. Claude: Updates CSS/JS
3. Claude: Takes screenshots:
   - Top of page (no shadow)
   - Scrolled page (with shadow)
4. Claude: Shows both states to user
```

### Workflow 4: Form Validation
```
1. User: "Add email validation to signup form"
2. Claude: Implements validation
3. Claude: Interactive test:
   - Empty field submission → error screenshot
   - Invalid email → error screenshot
   - Valid email → success screenshot
4. Claude: Shows all three states
```

---

## Integration with Existing Tools

### Use with `with_server.py`
```bash
# For apps that need server management
python scripts/with_server.py \
  --server "npm run dev" \
  --port 3000 \
  -- python verify_ui.py
```

### Use with Vibium MCP Tools (Enforced)
```
# Direct Vibium MCP calls for quick checks
mcp__vibium__browser_launch()
mcp__vibium__browser_navigate(url="http://localhost:3000")
mcp__vibium__browser_screenshot(path="/tmp/verify.png")
mcp__vibium__browser_quit()
```

---

## When NOT to Take Screenshots

❌ **Skip visual verification for:**
- Pure backend changes (API endpoints, database)
- Non-visual bug fixes (logic errors)
- Configuration changes
- Documentation updates
- Test file changes

✅ **But DO verify if:**
- User explicitly asks to see it
- Change affects rendered output in any way

---

## Error Handling

### Server Not Running
```python
try:
    page.goto('http://localhost:3000', timeout=5000)
except:
    print("❌ Server not running. Starting dev server...")
    # Start server, then retry
```

### Element Not Found
```python
# Wait for element with timeout
try:
    page.wait_for_selector('.user-card', timeout=5000)
    page.screenshot(path='/tmp/verify.png')
except:
    print("⚠️  Element not found. Taking full page screenshot instead:")
    page.screenshot(path='/tmp/full_page.png', full_page=True)
```

---

## Quick Reference

| Situation | Action | Time |
|-----------|--------|------|
| Added button/component | Quick screenshot | 10s |
| Fixed layout bug | Before/after screenshots | 20s |
| Form with validation | Interactive test + screenshots | 1-2min |
| Responsive change | Desktop + mobile screenshots | 30s |
| Major feature | Use `/design-review-ui` | 5-15min |

---

## Template Scripts

### 1. Quick Verification Script
```python
# /tmp/quick_verify.py
from playwright.sync_api import sync_playwright
import sys

url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3000'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(url)
    page.wait_for_load_state('networkidle')
    page.screenshot(path='/tmp/verify.png', full_page=True)
    browser.close()
    print("✅ Screenshot saved to /tmp/verify.png")
```

**Usage:**
```bash
python /tmp/quick_verify.py http://localhost:3000/dashboard
```

### 2. Responsive Verification
```python
# /tmp/responsive_check.py
from playwright.sync_api import sync_playwright
import sys

url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:3000'

viewports = {
    'desktop': {'width': 1440, 'height': 900},
    'tablet': {'width': 768, 'height': 1024},
    'mobile': {'width': 375, 'height': 667}
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    for name, size in viewports.items():
        page.set_viewport_size(size)
        page.goto(url)
        page.wait_for_load_state('networkidle')
        page.screenshot(path=f'/tmp/{name}.png', full_page=True)
        print(f"✅ {name}: /tmp/{name}.png")

    browser.close()
```

---

## Summary: Default Claude Behavior

**When making UI changes, Claude should:**

1. ✅ Write the code
2. ✅ Start/verify dev server is running
3. ✅ Take screenshot(s) of the change
4. ✅ Show user the visual result with context
5. ✅ Mention what to look for ("Notice the shadow on scroll")

**This happens automatically for UI work. No need to ask "show me a screenshot"**

---

## Bypass Mode Behavior

In bypass/yolo mode (`claude --dangerously-skip-permissions`):
- Still take screenshots for verification
- Auto-start dev server if needed
- Save screenshots to `/tmp/`
- Report file paths to user (can't display inline in CLI)
