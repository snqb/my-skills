---
name: browser-testing
description: "Interactive browser automation via Agent Browser Protocol (ABP) and ad-hoc Playwright scripts. Use for exploring sites, extracting data, and visual verification."
---

# Browser Testing & Tools

Two ways to work with the browser:
1. **Interactive (ABP)**: Use pre-built scripts for quick navigation, picking, and state extraction. (DEFAULT)
2. **Scripted (Playwright)**: Write ad-hoc JS scripts for complex multi-step flows or testing.

## 1. Interactive Tools (Agent Browser Protocol)

ABP is a Chromium fork with an embedded REST API. It's extremely fast and handles page "settling" automatically.

### Setup
```bash
{baseDir}/browser-start.js              # Start ABP on :8222
```

### Common Actions
```bash
{baseDir}/browser-nav.js <url>          # Navigate
{baseDir}/browser-click.js <x> <y>      # Click at coordinates
{baseDir}/browser-type.js <text>        # Type text
{baseDir}/browser-screenshot.js         # Screenshot (interactive markup by default)
{baseDir}/browser-eval.js 'code'        # Execute JS
{baseDir}/browser-pick.js 'message'     # Interactive element picker (user clicks)
{baseDir}/browser-content.js <url>      # Extract readable markdown
{baseDir}/browser-cookies.js            # View non-HttpOnly cookies
```

### Why use ABP?
- **~100ms overhead**: Much faster than standard CDP.
- **Automatic Settle**: No manual `sleep` needed; actions return only when page is ready.
- **Interactive Markup**: Screenshots automatically highlight clickable elements.

---

## 2. Scripted Testing (Playwright)

For complex multi-step tests, write a script to `/tmp/` and run it.

```javascript
// /tmp/test.js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:3000');
  await page.screenshot({ path: '/tmp/test.png' });
  await browser.close();
})();
```

### Interaction Patterns (Playwright)
```javascript
await page.locator('input').fill('Text');
await page.keyboard.press('Enter');
await page.waitForSelector('.success');
```

---

## Rules

1. **Start with ABP**: It's the fastest way to explore and extract.
2. **Screenshot often**: Visual proof is essential for agent reasoning.
3. **Use Pick**: If you can't find a selector, use `{baseDir}/browser-pick.js` to let the user help.
4. **Clean up**: Delete ad-hoc Playwright scripts from `/tmp/` after use.
5. **ABP Port**: Always use `:8222`.
