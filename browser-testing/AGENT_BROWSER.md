# Vercel agent-browser Integration

> **Philosophy:** Accessibility-tree first, optimized for AI comprehension

## What is agent-browser?

A **Rust CLI** (with Node.js fallback) built by Vercel specifically for AI agents. Uses **82% less context than Playwright MCP** by exposing pages as **accessibility trees** instead of raw DOM.

### Key Differentiators

1. **@element references** - Elements get unique IDs (@e1, @e2) for LLM-friendly selection
2. **Semantic snapshots** - Accessibility tree representation (roles, labels, text)
3. **Session management** - Run multiple isolated browser instances
4. **Persistent profiles** - Maintain authentication across sessions
5. **Rust performance** - Faster than Node.js alternatives

**Perfect for:** AI agents that need to **understand page structure** (not just interact)

---

## Installation

```bash
# Global install
npm install -g agent-browser

# Download Chromium
agent-browser install

# Linux with system deps
agent-browser install --with-deps
```

**As Claude Skill:**
```bash
mkdir -p ~/.claude/skills/agent-browser
curl -o ~/.claude/skills/agent-browser/SKILL.md \
  https://raw.githubusercontent.com/vercel-labs/agent-browser/main/skills/agent-browser/SKILL.md
```

---

## Usage Patterns

### Pattern 1: Snapshot-Based Navigation

**Traditional Playwright:**
```javascript
await page.goto('https://example.com');
const button = await page.locator('button.submit');
await button.click();
```

**agent-browser:**
```bash
agent-browser goto "https://example.com"
agent-browser snapshot  # Returns accessibility tree with @e1, @e2, etc.

# Output (simplified):
# @e1: button "Submit Form" (role: button, clickable)
# @e2: input "Email" (role: textbox, editable)
# @e3: link "Sign Up" (role: link, clickable)

agent-browser click "@e1"  # Click by reference
```

**Why Better:** No CSS selector fragility. LLM understands "@e1: button 'Submit Form'" natively.

---

### Pattern 2: Persistent Sessions

**Use Case:** Stay logged in across multiple runs

```bash
# Create session with persistent profile
agent-browser session create "my-session" --persistent

# Login once
agent-browser --session "my-session" goto "https://app.example.com/login"
agent-browser --session "my-session" type "@e2" "user@example.com"
agent-browser --session "my-session" type "@e3" "password123"
agent-browser --session "my-session" click "@e1"

# Future runs reuse session (already logged in)
agent-browser --session "my-session" goto "https://app.example.com/dashboard"
agent-browser --session "my-session" snapshot  # Still authenticated
```

**Why Better:** No cookie/storage management. Session persists automatically.

---

### Pattern 3: Network Mocking

```bash
# Mock API endpoint
agent-browser mock "https://api.example.com/users" \
  --response '{"users": [{"id": 1, "name": "Test User"}]}'

agent-browser goto "https://app.example.com"
agent-browser snapshot  # Page uses mocked data
```

**Why Better:** One-liner mocking vs Playwright's `page.route()` ceremony.

---

### Pattern 4: Multi-Instance Testing

```bash
# Run 3 browsers in parallel
agent-browser session create "user1"
agent-browser session create "user2"
agent-browser session create "user3"

agent-browser --session "user1" goto "https://example.com" &
agent-browser --session "user2" goto "https://example.com" &
agent-browser --session "user3" goto "https://example.com" &

wait  # All 3 navigate concurrently
```

**Why Better:** Built-in session isolation (no manual context management).

---

### Pattern 5: Semantic Element Selection

```bash
agent-browser goto "https://github.com/login"
agent-browser snapshot

# Output (simplified):
# @e1: input "Username or email address" (role: textbox)
# @e2: input "Password" (role: textbox, password)
# @e3: button "Sign in" (role: button)

# Select by role/label (semantic)
agent-browser type "@e1" "myusername"
agent-browser type "@e2" "mypassword"
agent-browser click "@e3"
```

**Why Better:** No XPath like `//input[@placeholder='Username or email address']`. Just `@e1`.

---

## When to Use agent-browser vs Playwright

| Use Case | agent-browser | Playwright |
|----------|---------------|------------|
| AI agent needs to understand page | ✅ Yes (accessibility tree) | ❌ No (raw DOM) |
| Maintain login across runs | ✅ Yes (persistent sessions) | ⚠️ Manual (cookies/storage) |
| Simple click/type with AI | ✅ Yes (@element refs) | ⚠️ Fragile (CSS selectors) |
| Complex conditionals/loops | ⚠️ CLI-limited | ✅ Yes (full JS control) |
| Network mocking | ✅ Yes (one-liner) | ✅ Yes (more powerful) |
| File upload/download | ⚠️ Limited | ✅ Yes (full API) |
| Cross-browser (Firefox/WebKit) | ❌ No (Chromium only) | ✅ Yes |
| PDF generation | ✅ Yes | ✅ Yes |

**Golden Rule:**
- **agent-browser** for AI comprehension tasks (explore, understand, navigate)
- **Playwright** for programmatic logic (loops, conditionals, file ops)

---

## Integration with Vibium + Playwright

### Tier 1: Vibium (Simple MCP)
- Click, type, screenshot
- Form filling
- Visual verification
- **90% of tasks**

### Tier 2: agent-browser (AI Comprehension)
- Page understanding (accessibility tree)
- Persistent sessions
- Semantic element selection
- **5% of tasks** (AI needs to understand)

### Tier 3: Playwright (Complex Logic)
- Conditional loops
- File handling
- Advanced mocking
- **5% of tasks** (programmatic control)

---

## Example: Hybrid Workflow

**Scenario:** "Explore the dashboard, find broken links, generate report"

**Step 1: Understand (agent-browser)**
```bash
agent-browser goto "http://localhost:3000/dashboard"
agent-browser snapshot > /tmp/dashboard-snapshot.txt

# Parse snapshot to find all links
grep -E "@e[0-9]+: link" /tmp/dashboard-snapshot.txt > /tmp/links.txt
```

**Step 2: Verify (Playwright loop)**
```javascript
// /tmp/verify-links.js
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const links = fs.readFileSync('/tmp/links.txt', 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const match = line.match(/@e\d+: link "(.+)" \(href: "(.+)"\)/);
      return match ? { text: match[1], href: match[2] } : null;
    })
    .filter(Boolean);

  const broken = [];

  for (const link of links) {
    const response = await page.goto(link.href);
    if (!response.ok()) {
      broken.push({ ...link, status: response.status() });
    }
  }

  console.log('Broken links:', JSON.stringify(broken, null, 2));
  fs.writeFileSync('/tmp/broken-links.json', JSON.stringify(broken, null, 2));

  await browser.close();
})();
```

**Step 3: Report (Vibium screenshot)**
```
# Run verification
cd ~/.claude/skills/playwright-advanced && node run.js /tmp/verify-links.js

# Screenshot dashboard with overlay
mcp__vibium__browser_launch
mcp__vibium__browser_navigate → http://localhost:3000/dashboard
mcp__vibium__browser_screenshot → dashboard-verified.png
mcp__vibium__browser_quit
```

**Result:** agent-browser for understanding, Playwright for logic, Vibium for visuals.

---

## CLI Reference

### Navigation
```bash
agent-browser goto "URL"
agent-browser back
agent-browser forward
agent-browser reload
```

### Inspection
```bash
agent-browser snapshot              # Accessibility tree
agent-browser snapshot --mode dom   # Raw DOM (verbose)
agent-browser screenshot PATH       # PNG capture
agent-browser pdf PATH              # PDF export
```

### Interaction
```bash
agent-browser click "@e1"           # By reference
agent-browser click "button.submit" # By CSS selector
agent-browser type "@e2" "text"     # Type into element
agent-browser press "Enter"         # Keyboard event
```

### Sessions
```bash
agent-browser session create NAME [--persistent]
agent-browser session list
agent-browser session delete NAME
agent-browser --session NAME <command>
```

### Network
```bash
agent-browser mock "URL" --response '{"key": "value"}'
agent-browser mock "URL" --status 404
agent-browser intercept "*.css" --block  # Block CSS
```

### JavaScript
```bash
agent-browser eval "document.title"
agent-browser eval "window.scrollTo(0, document.body.scrollHeight)"
```

---

## Installation as Claude Skill

**Method 1: Global CLI (Recommended)**
```bash
npm install -g agent-browser
agent-browser install
```

**Method 2: Skill File (for auto-activation)**
```bash
mkdir -p ~/.claude/skills/agent-browser
curl -o ~/.claude/skills/agent-browser/SKILL.md \
  https://raw.githubusercontent.com/vercel-labs/agent-browser/main/skills/agent-browser/SKILL.md
```

**Verify:**
```bash
agent-browser --version
agent-browser goto "https://example.com"
agent-browser snapshot | head -20
```

---

## Comparison: Context Usage

| Tool | Context for "Click Submit Button" |
|------|-----------------------------------|
| Playwright MCP | ~800 tokens (full DOM + selectors) |
| agent-browser | ~150 tokens (`@e1: button "Submit"`) |
| **Savings** | **82% less context** |

**Why It Matters:**
- Faster LLM responses (less input)
- Lower API costs (fewer tokens)
- Clearer agent understanding (semantic IDs)

---

## Best Practices

### Use agent-browser When:
✅ AI needs to explore/understand page structure
✅ Maintaining authentication across sessions
✅ Semantic element selection (by role/label)
✅ Quick one-off tasks (CLI convenience)
✅ Reducing LLM context usage (accessibility tree)

### Use Playwright When:
✅ Complex programmatic logic (loops, conditionals)
✅ File upload/download
✅ Advanced network interception
✅ Cross-browser testing (Firefox, WebKit)
✅ Full API control (Playwright library)

### Use Vibium When:
✅ Simple click/type/screenshot (MCP convenience)
✅ Form filling
✅ Visual verification (screenshot comparison)

---

## Summary

**agent-browser = Playwright optimized for AI agents**

**Key Advantages:**
1. **82% less context** via accessibility trees
2. **@element references** for LLM-friendly selection
3. **Persistent sessions** for maintained state
4. **Semantic snapshots** for page understanding
5. **Rust performance** for speed

**Integration Strategy:**
- **Vibium** for simple tasks (90%)
- **agent-browser** for AI comprehension (5%)
- **Playwright** for complex logic (5%)

**Installation:**
```bash
npm install -g agent-browser
agent-browser install
```

**First Command:**
```bash
agent-browser goto "https://example.com" && agent-browser snapshot
```

**Skill File:** Available at https://github.com/vercel-labs/agent-browser/tree/main/skills/agent-browser

---

**Related:**
- ENHANCED_PATTERNS.md - Vibium + Playwright patterns
- SKILL.md - Main webapp-testing skill
- ~/.claude/skills/playwright-advanced/ - Full Playwright integration
