---
name: browser-testing
description: "Complete browser automation: Vibium MCP (90%), agent-browser (5%), Playwright (5%), CDP tools, visual regression. Use for: test UI, automate browser, screenshot, visual diff, e2e testing, form testing, responsive testing."
---

# Browser Testing — Automation + Visual Regression

Four tiers of browser automation + visual regression testing in one skill.

## Tier Strategy

| Tier | Tool | Use Case | % |
|------|------|----------|---|
| 0 | CDP Tools | Raw Chrome control, element picking | 5% |
| 1 | Vibium MCP | Click, type, screenshot, simple flows | 85% |
| 2 | agent-browser | AI comprehension, persistent sessions | 5% |
| 3 | Playwright | Complex logic, files, mocking | 5% |

**Always start with Vibium (Tier 1).** Escalate only when needed.

---

## Tier 0: CDP Tools (Raw Chrome)

Direct Chrome DevTools Protocol control. Use for element picking, debugging, content extraction.

### Setup

```bash
cd skills/browser-testing && npm install
```

### Commands

```bash
# Start Chrome with remote debugging
./browser-start.js              # Fresh profile
./browser-start.js --profile    # Copy user's profile (keeps logins)

# Navigate
./browser-nav.js https://example.com
./browser-nav.js https://example.com --new  # New tab

# Evaluate JavaScript
./browser-eval.js 'document.title'
./browser-eval.js 'document.querySelectorAll("a").length'

# Screenshot current viewport
./browser-screenshot.js

# Interactive element picker (user clicks to select)
./browser-pick.js "Click the submit button"

# Get cookies
./browser-cookies.js

# Extract page content as markdown
./browser-content.js https://example.com
```

### When to Use CDP
- User says "I want to click that button" → `browser-pick.js`
- Debug authentication issues → `browser-cookies.js`
- Extract readable content → `browser-content.js`
- Need raw JS evaluation → `browser-eval.js`

---

## Tier 1: Vibium MCP (Default — 85%)

MCP-native browser automation. Simple, reliable, no scripts needed.

### Core Tools

```
mcp__vibium__browser_launch     # Start browser
mcp__vibium__browser_navigate   # Go to URL
mcp__vibium__browser_click      # Click element (CSS selector)
mcp__vibium__browser_type       # Type into input
mcp__vibium__browser_find       # Find elements (returns tag, text, bbox)
mcp__vibium__browser_screenshot # Capture screen
mcp__vibium__browser_wait_for   # Wait for element
mcp__vibium__browser_quit       # Close browser
```

### Common Patterns

**Visual verification (REQUIRED for UI changes):**
```
1. Launch browser
2. Navigate to URL
3. Screenshot
4. Show user
5. Quit browser
```

**Form testing:**
```
1. Launch, navigate
2. Type into each field
3. Click submit
4. Wait for result
5. Screenshot
6. Quit
```

**Multi-page flow:**
```
1. Launch
2. Navigate page 1 → screenshot
3. Click nav link
4. Screenshot page 2
5. Quit
```

### Rules
- **Always screenshot after UI changes** — Visual proof
- **Always quit when done** — Clean up resources
- Don't ask "want to see?" — Just show the screenshot

---

## Tier 2: agent-browser (AI Comprehension — 5%)

Use when you need to understand page structure or maintain sessions.

See `AGENT_BROWSER.md` for full reference.

### When to Use
- Understand unfamiliar UI structure
- Maintain login across runs (persistent sessions)
- Semantic element selection (by role/label)
- 82% less context than Playwright MCP

### Key Features
- Accessibility tree with `@e1` references
- Persistent browser sessions
- AI-optimized page understanding

---

## Tier 3: Playwright (Complex Logic — 5%)

Full programmatic control. Use for loops, conditionals, files, mocking.

See `ENHANCED_PATTERNS.md` for 10 detailed patterns.

### When to Use
- Conditional logic (if/else over dynamic content)
- File upload/download
- Network mocking
- Parallel execution
- Cross-browser (Firefox, WebKit)
- PDF generation

### Execution Pattern

```javascript
// Write to /tmp/playwright-test-*.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  await page.screenshot({ path: '/tmp/result.png' });
  
  await browser.close();
})();
```

```bash
cd skills/browser-testing && node run.js /tmp/playwright-test-*.js
```

---

## Visual Regression Testing

Detect unintended visual changes by comparing screenshots.

### Playwright Built-in

```typescript
import { test, expect } from '@playwright/test';

test('homepage matches baseline', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    maxDiffPixels: 100,
  });
});

// Responsive testing
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
];

for (const vp of viewports) {
  test(`homepage at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');
    await expect(page).toHaveScreenshot(`homepage-${vp.name}.png`);
  });
}
```

### Handle Dynamic Content

```typescript
test('page with dynamic content', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Hide timestamps
  await page.addStyleTag({
    content: '.timestamp { visibility: hidden; }'
  });
  
  // Mask dynamic regions
  await expect(page).toHaveScreenshot({
    mask: [
      page.locator('.ad-banner'),
      page.locator('.live-chat'),
    ],
  });
});
```

### Percy (Cloud-based)

```typescript
import percySnapshot from '@percy/playwright';

test('homepage', async ({ page }) => {
  await page.goto('/');
  await percySnapshot(page, 'Homepage');
});
```

### Chromatic (Storybook)

```bash
npm install --save-dev chromatic
npx chromatic --project-token=<TOKEN>
```

### BackstopJS

```bash
backstop reference  # Create baselines
backstop test       # Compare
backstop approve    # Accept changes
```

### Best Practices

✅ **Do:**
- Hide dynamic content (timestamps, ads)
- Test multiple viewports
- Wait for animations to complete
- Disable animations during capture
- Store baselines in version control

❌ **Don't:**
- Test pages with random data
- Use 0% diff threshold (too strict)
- Skip responsive testing
- Commit unapproved diffs

---

## Decision Matrix

| Task | Tier | Tool |
|------|------|------|
| Click button | 1 | Vibium |
| Fill form | 1 | Vibium |
| Screenshot | 1 | Vibium |
| User picks element | 0 | CDP `browser-pick.js` |
| Debug cookies | 0 | CDP `browser-cookies.js` |
| Extract content | 0 | CDP `browser-content.js` |
| Understand page structure | 2 | agent-browser |
| Keep login across runs | 2 | agent-browser |
| Loop with conditionals | 3 | Playwright |
| File upload/download | 3 | Playwright |
| Mock API responses | 3 | Playwright |
| Visual regression | 3 | Playwright/Percy |
| Cross-browser | 3 | Playwright |

---

## Additional Docs

- `AGENT_BROWSER.md` — Tier 2 agent-browser reference
- `ENHANCED_PATTERNS.md` — 10 Playwright patterns
- `VISUAL_TESTING_WORKFLOW.md` — Visual regression details
