# Enhanced Browser Automation Patterns

> **Philosophy:** Vibium for simple tasks (95%), Playwright for complex automation (5%)

## When to Use What

### Use Vibium MCP (Default - 95% of cases)
✅ Simple click/type/screenshot flows
✅ Form filling and submission
✅ Multi-page navigation with verification
✅ Console log inspection
✅ Network request monitoring
✅ Visual regression testing (screenshot comparison)

### Use Playwright Skill (Advanced - 5% of cases)
✅ Complex conditional logic based on page state
✅ Programmatic loops over dynamic content
✅ File upload/download scenarios
✅ Advanced network interception/mocking
✅ PDF generation from pages
✅ Geolocation/permissions testing
✅ Cross-browser testing (Chromium, Firefox, WebKit)
✅ Parallel test execution

---

## Pattern 1: Simple Visual Verification (Vibium)

**Use Case:** "Check if the homepage loads correctly"

```
1. mcp__vibium__browser_launch
2. mcp__vibium__browser_navigate → http://localhost:3000
3. mcp__vibium__browser_screenshot → homepage.png
4. Show user the screenshot
5. mcp__vibium__browser_quit
```

**Why Vibium:** No complex logic, just verify visual state

---

## Pattern 2: Form Testing (Vibium)

**Use Case:** "Test the contact form submission"

```
1. Launch browser
2. Navigate to /contact
3. Type into input[name="email"] → "test@example.com"
4. Type into textarea[name="message"] → "Test message"
5. Click button[type="submit"]
6. Wait for success message (browser_wait_for)
7. Screenshot result
8. Quit browser
```

**Why Vibium:** Straightforward interaction sequence

---

## Pattern 3: Multi-Page Flow (Vibium)

**Use Case:** "Test the checkout flow"

```
1. Launch browser
2. Navigate to /products
3. Click .product-card:first-child .add-to-cart
4. Screenshot (cart updated)
5. Navigate to /cart
6. Screenshot (cart page)
7. Click .checkout-button
8. Screenshot (checkout page)
9. Quit browser
```

**Why Vibium:** Linear flow with visual checkpoints

---

## Pattern 4: Conditional Logic (Playwright)

**Use Case:** "Add all items under $50 to cart, skip out of stock"

**Vibium Can't Do:** Loop over dynamic items with conditional logic

**Playwright Solution:**
```javascript
// /tmp/playwright-test-conditional.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/products');

  // Get all product cards
  const products = await page.$$('.product-card');

  for (const product of products) {
    // Check price
    const priceText = await product.$eval('.price', el => el.textContent);
    const price = parseFloat(priceText.replace('$', ''));

    // Check stock status
    const inStock = await product.$eval('.stock-status', el =>
      el.textContent === 'In Stock'
    );

    // Conditional add to cart
    if (price < 50 && inStock) {
      await product.click('.add-to-cart');
      await page.waitForTimeout(500); // Wait for animation
    }
  }

  await page.screenshot({ path: '/tmp/cart-result.png' });
  await browser.close();
})();
```

**Run:** `cd ~/.claude/skills/playwright-advanced && node run.js /tmp/playwright-test-conditional.js`

---

## Pattern 5: File Upload (Playwright)

**Use Case:** "Upload CSV file and verify import"

**Vibium Can't Do:** File input handling (limitation)

**Playwright Solution:**
```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/import');

  // Upload file
  const fileInput = await page.$('input[type="file"]');
  await fileInput.setInputFiles('/path/to/test-data.csv');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for processing
  await page.waitForSelector('.import-success', { timeout: 10000 });

  // Verify results
  const rowCount = await page.textContent('.import-summary .row-count');
  console.log(`Imported ${rowCount} rows`);

  await page.screenshot({ path: '/tmp/import-success.png' });
  await browser.close();
})();
```

---

## Pattern 6: Network Mocking (Playwright)

**Use Case:** "Test UI with mocked API responses"

**Vibium Can't Do:** Network interception/mocking

**Playwright Solution:**
```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Mock API response
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'Test User 1' },
        { id: 2, name: 'Test User 2' }
      ])
    });
  });

  await page.goto('http://localhost:3000/users');
  await page.waitForSelector('.user-list');

  // Verify mocked data rendered
  const userCount = await page.$$eval('.user-item', items => items.length);
  console.log(`Rendered ${userCount} users from mock`);

  await page.screenshot({ path: '/tmp/mocked-users.png' });
  await browser.close();
})();
```

---

## Pattern 7: Parallel Execution (Playwright)

**Use Case:** "Test 5 different pages simultaneously"

**Vibium Can't Do:** Parallel browser contexts

**Playwright Solution:**
```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });

  // Test multiple pages in parallel
  const pages = [
    '/home',
    '/products',
    '/about',
    '/contact',
    '/blog'
  ];

  await Promise.all(pages.map(async (path) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`http://localhost:3000${path}`);
    await page.screenshot({
      path: `/tmp/screenshot-${path.replace('/', '')}.png`
    });

    await context.close();
  }));

  await browser.close();
  console.log('All pages tested in parallel');
})();
```

---

## Pattern 8: Visual Regression (Vibium + Comparison)

**Use Case:** "Detect visual changes between builds"

**Hybrid Approach:**

```bash
# Step 1: Baseline (Vibium)
1. Launch browser
2. Navigate to /dashboard
3. Screenshot → baseline-dashboard.png
4. Quit

# Step 2: After changes (Vibium)
1. Launch browser
2. Navigate to /dashboard
3. Screenshot → current-dashboard.png
4. Quit

# Step 3: Compare (External tool)
npm install -g pixelmatch
node -e "
  const fs = require('fs');
  const PNG = require('pngjs').PNG;
  const pixelmatch = require('pixelmatch');

  const img1 = PNG.sync.read(fs.readFileSync('baseline-dashboard.png'));
  const img2 = PNG.sync.read(fs.readFileSync('current-dashboard.png'));
  const { width, height } = img1;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    img1.data, img2.data, diff.data, width, height,
    { threshold: 0.1 }
  );

  fs.writeFileSync('diff-dashboard.png', PNG.sync.write(diff));
  console.log(\`Found \${numDiffPixels} different pixels\`);
"
```

**Why Hybrid:** Vibium for screenshot capture, external tool for pixel diff

---

## Pattern 9: Geolocation Testing (Playwright)

**Use Case:** "Test location-based features"

**Vibium Can't Do:** Browser permissions/geolocation

**Playwright Solution:**
```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });

  // Create context with geolocation
  const context = await browser.newContext({
    geolocation: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
    permissions: ['geolocation']
  });

  const page = await context.newPage();
  await page.goto('http://localhost:3000/map');

  // Verify map centered on SF
  const mapCenter = await page.evaluate(() => {
    return {
      lat: window.map.getCenter().lat(),
      lng: window.map.getCenter().lng()
    };
  });

  console.log(`Map centered at: ${mapCenter.lat}, ${mapCenter.lng}`);
  await page.screenshot({ path: '/tmp/map-geolocation.png' });

  await browser.close();
})();
```

---

## Pattern 10: PDF Generation (Playwright)

**Use Case:** "Export dashboard as PDF"

**Vibium Can't Do:** PDF export

**Playwright Solution:**
```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');

  // Generate PDF
  await page.pdf({
    path: '/tmp/dashboard-export.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', bottom: '20px' }
  });

  console.log('PDF generated: /tmp/dashboard-export.pdf');
  await browser.close();
})();
```

---

## Decision Flowchart

```
Start
  ↓
Does it need loops/conditions based on page content?
  YES → Use Playwright
  NO ↓
Does it need file upload/download?
  YES → Use Playwright
  NO ↓
Does it need network mocking/interception?
  YES → Use Playwright
  NO ↓
Does it need parallel execution?
  YES → Use Playwright
  NO ↓
Does it need geolocation/permissions?
  YES → Use Playwright
  NO ↓
Does it need PDF generation?
  YES → Use Playwright
  NO ↓
Is it click/type/screenshot/verify?
  YES → Use Vibium (DEFAULT)
```

---

## Playwright Helpers Reference

Located in `~/.claude/skills/playwright-advanced/lib/helpers.js`:

```javascript
const helpers = require('./lib/helpers');

// Auto-detect dev server
const servers = await helpers.detectDevServers();
console.log(servers); // [{ command: 'npm run dev', port: 5173 }]

// Safe click with retry
await helpers.safeClick(page, '.submit-button', { retries: 3 });

// Screenshot with auto-naming
await helpers.screenshot(page, 'checkout-success');

// Extract table data
const data = await helpers.extractTableData(page, 'table.results');
console.log(data); // [{ col1: 'val1', col2: 'val2' }, ...]

// Handle cookies
await helpers.acceptCookies(page); // Auto-detects cookie banners
```

---

## Best Practices

### Vibium Best Practices
✅ Always `browser_quit` when done
✅ Use descriptive selectors (`button[data-testid="submit"]` > `button`)
✅ Wait for elements before interacting (`browser_wait_for`)
✅ Screenshot after every critical step
✅ Show screenshots to user immediately (don't ask first)

### Playwright Best Practices
✅ Write scripts to `/tmp/playwright-test-*.js` (not skill directory)
✅ Use `headless: false` for debugging (visible browser)
✅ Set explicit timeouts for slow operations
✅ Clean up resources (`browser.close()`)
✅ Log progress to console for Claude visibility

### Universal Best Practices
✅ Start with Vibium, escalate to Playwright only when needed
✅ Use `localhost` URLs for local testing
✅ Verify dev server is running before testing
✅ Use CSS selectors over XPath (more maintainable)
✅ Test in Chromium first, expand to Firefox/WebKit if needed

---

## Common Issues & Solutions

### Issue: "Element not found"
**Solution:** Add wait before interaction
```javascript
// Vibium
browser_wait_for('.submit-button', { timeout: 5000 })

// Playwright
await page.waitForSelector('.submit-button', { timeout: 5000 });
```

### Issue: "Click not working"
**Solution:** Wait for stability
```javascript
// Playwright
await page.waitForSelector('.button', { state: 'visible' });
await page.waitForTimeout(300); // Wait for animations
await page.click('.button');
```

### Issue: "Dev server not running"
**Solution:** Auto-detect and start
```javascript
const helpers = require('./lib/helpers');
const servers = await helpers.detectDevServers();

if (servers.length > 0) {
  console.log(`Found server: ${servers[0].command}`);
  // Start with: npm run dev or python scripts/with_server.py
}
```

### Issue: "Screenshot is blank"
**Solution:** Wait for content load
```javascript
// Vibium
browser_wait_for('img.hero', { timeout: 5000 })
browser_screenshot

// Playwright
await page.waitForLoadState('networkidle');
await page.screenshot({ path: '/tmp/result.png' });
```

---

## Summary: The 95/5 Rule

**95% of tasks:** Use Vibium MCP (simple, fast, reliable)
- Click, type, screenshot
- Form filling, navigation
- Visual verification

**5% of tasks:** Use Playwright Skill (complex, programmable)
- Conditional logic, loops
- File handling, network mocking
- Parallel execution, PDF generation

**Golden Rule:** Start with Vibium. Only escalate to Playwright when you hit a wall.
