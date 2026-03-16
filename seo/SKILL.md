---
name: seo
description: >
  Full-stack SEO: technical audit (crawlability, indexability, CWV, security),
  on-page analysis (meta, headings, content, images), structured data (JSON-LD),
  sitemaps, hreflang, internal linking, and actionable fixes. Use when user says
  "SEO audit", "check SEO", "why isn't my page ranking", "structured data",
  "sitemap", "Core Web Vitals", "meta tags", "hreflang", or "image optimization".
---

# SEO — Unified Audit & Fix Skill

One skill, eight domains. Audit what exists, fix what's broken, generate what's missing.

## Quick Start

```
"Audit SEO for this site"         → Full audit (all 8 domains)
"Check this page's SEO"           → Single-page deep analysis
"Generate schema for this page"   → JSON-LD structured data
"Fix my sitemap"                  → Sitemap validation + generation
"Why isn't this page ranking?"    → On-page + technical diagnosis
```

---

## 1. Technical Audit

Score each category, flag issues by severity (Critical / High / Medium / Low).

### 1.1 Crawlability
- **robots.txt**: exists, valid syntax, sitemap declared, no accidental blocks
- **XML sitemap**: valid, <50K URLs per file, referenced in robots.txt
- **Crawl depth**: important pages within 3 clicks of homepage
- **Crawl budget**: for large sites — duplicate/thin content wastes budget
- **JS rendering**: is critical content in initial HTML or behind JS?

**AI Crawler Management (2025–2026):**

| Crawler | Company | Token | Purpose |
|---------|---------|-------|---------|
| GPTBot | OpenAI | `GPTBot` | Training |
| ChatGPT-User | OpenAI | `ChatGPT-User` | Browsing |
| ClaudeBot | Anthropic | `ClaudeBot` | Training |
| Google-Extended | Google | `Google-Extended` | Gemini training (NOT search) |
| PerplexityBot | Perplexity | `PerplexityBot` | Search + training |
| Bytespider | ByteDance | `Bytespider` | Training |

Blocking `Google-Extended` does NOT affect Google Search or AI Overviews — those use `Googlebot`.

### 1.2 Indexability
- **Canonical tags**: present, self-referencing, no conflicts with noindex
- **Duplicate content**: near-duplicates, parameter URLs, www/non-www, http/https
- **Index blockers**: noindex meta, noindex X-Robots-Tag, robots.txt blocked, canonical to other
- **Thin content**: pages below minimum word count for their type
- **Index bloat**: unnecessary pages in index consuming crawl budget

**JS SEO (Dec 2025 Google update):**
- If raw HTML canonical differs from JS-injected canonical, Google may use either
- `noindex` in raw HTML may be honored even if JS removes it
- Google does NOT render JS on non-200 pages
- Serve critical SEO elements (canonical, meta robots, structured data, title) in initial server HTML

### 1.3 Core Web Vitals
Evaluation uses **75th percentile** of real user data.

| Metric | Good | Needs Work | Poor |
|--------|------|------------|------|
| **LCP** (Largest Contentful Paint) | <2.5s | 2.5–4s | >4s |
| **INP** (Interaction to Next Paint) | <200ms | 200–500ms | >500ms |
| **CLS** (Cumulative Layout Shift) | <0.1 | 0.1–0.25 | >0.25 |

INP replaced FID on March 12, 2024. **Never reference FID.**

Use PageSpeed Insights API if available:
```
https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=URL&strategy=mobile
```

### 1.4 Security
- HTTPS enforced, valid SSL, no mixed content
- HSTS header with `includeSubDomains`
- Security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Check HSTS preload list for high-security sites

### 1.5 URL Structure
- Clean: descriptive, hyphenated, lowercase, no query params for content
- Hierarchy: logical folder structure reflecting site architecture
- Redirects: no chains (max 1 hop), 301 for permanent
- Length: flag >100 chars
- Trailing slashes: consistent

### 1.6 Mobile
**Mobile-first indexing is 100% complete (July 2024).** Google crawls ALL sites with mobile Googlebot.

- Responsive: viewport meta, responsive CSS
- Touch targets: minimum 48×48px, 8px spacing
- Font size: minimum 16px base
- No horizontal scroll
- Test: does content match between mobile and desktop?

---

## 2. On-Page Analysis

### 2.1 Title Tag
- Length: 50–60 characters (Google truncates at ~60)
- Contains primary keyword near front
- Unique per page, not duplicated
- Compelling — optimized for CTR, not just keywords
- Brand: append brand name with `|` separator (e.g., `Primary Keyword | Brand`)

### 2.2 Meta Description
- Length: 120–160 characters
- Contains primary keyword (Google bolds matches)
- Includes call-to-action or value proposition
- Unique per page
- Not auto-generated placeholder text

### 2.3 Headings
- Exactly one `<h1>` per page, matches page intent
- H2–H6 logical hierarchy (no skipped levels)
- Headings are descriptive, not generic ("Section 1")
- Primary keyword in H1, secondary keywords in H2s

### 2.4 Content Quality
- Word count appropriate for page type (blog: 1500+, product: 300+, landing: 500+)
- Readability: grade level appropriate for audience
- Keyword density: 1–3%, with semantic variations
- E-E-A-T signals: author bio, credentials, experience markers, dates
- Freshness: publication + last-updated dates visible

### 2.5 Open Graph & Twitter Cards
```html
<meta property="og:type" content="website" />
<meta property="og:title" content="Title (70 chars max)" />
<meta property="og:description" content="Description (200 chars max)" />
<meta property="og:image" content="https://example.com/image.jpg" />  <!-- 1200×630px -->
<meta property="og:url" content="https://example.com/page" />
<meta property="og:locale" content="ru_RU" />
<meta name="twitter:card" content="summary_large_image" />
```

---

## 3. Images

### Alt Text
- Present on all `<img>` (except decorative: `role="presentation"`)
- Descriptive: describes content, not "image.jpg"
- 10–125 characters, includes keywords where natural

### File Size Targets

| Category | Target | Warning | Critical |
|----------|--------|---------|----------|
| Thumbnails | <50KB | >100KB | >200KB |
| Content | <100KB | >200KB | >500KB |
| Hero/banner | <200KB | >300KB | >700KB |

### Format Priority
1. **AVIF** (93.8% support) — best compression
2. **WebP** (95.3% support) — safe default
3. **JPEG/PNG** — fallback only

```html
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Description" width="800" height="600" loading="lazy" decoding="async">
</picture>
```

### Loading Strategy
- **Hero/LCP image**: `fetchpriority="high"`, NO `loading="lazy"`
- **Below-fold images**: `loading="lazy"` + `decoding="async"`
- **All images**: explicit `width` + `height` (prevents CLS)

### File Names
- Descriptive: `blue-running-shoes.webp` not `IMG_1234.jpg`
- Lowercase, hyphenated, no special characters

---

## 4. Structured Data (JSON-LD)

JSON-LD is Google's preferred format. Serve in initial HTML, not injected via JS.

### Active Types (recommend freely)
Organization, LocalBusiness, Product, ProductGroup, Offer, Service, Article, BlogPosting, NewsArticle, Review, AggregateRating, BreadcrumbList, WebSite, WebPage, Person, ProfilePage, VideoObject, ImageObject, Event, JobPosting, Course, SoftwareApplication, TravelGuide

### Restricted / Deprecated
- **FAQ**: ONLY for government/healthcare sites (restricted Aug 2023)
- **HowTo**: Rich results removed Sep 2023 — never recommend
- **SpecialAnnouncement**: Deprecated Jul 2025
- **FID-related**: FID fully removed Sep 2024

### Validation Checklist
- [ ] `@context`: `https://schema.org`
- [ ] `@type`: valid, active type
- [ ] All required properties present
- [ ] URLs are absolute (not relative)
- [ ] Dates in ISO 8601 format
- [ ] No placeholder text
- [ ] Consistent with visible page content (Google penalizes mismatch)

### Common Templates

**Organization:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "",
  "url": "",
  "logo": "",
  "contactPoint": { "@type": "ContactPoint", "telephone": "", "contactType": "customer service" },
  "sameAs": ["", ""]
}
```

**LocalBusiness:**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "", "url": "", "telephone": "",
  "address": { "@type": "PostalAddress", "streetAddress": "", "addressLocality": "", "addressCountry": "" },
  "geo": { "@type": "GeoCoordinates", "latitude": "", "longitude": "" },
  "openingHoursSpecification": [{ "@type": "OpeningHoursSpecification", "dayOfWeek": ["Mo","Tu","We","Th","Fr"], "opens": "09:00", "closes": "18:00" }]
}
```

**BreadcrumbList:**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com" },
    { "@type": "ListItem", "position": 2, "name": "Category", "item": "https://example.com/cat" },
    { "@type": "ListItem", "position": 3, "name": "Page" }
  ]
}
```

**Article:**
```json
{
  "@context": "https://schema.org", "@type": "Article",
  "headline": "", "author": { "@type": "Person", "name": "" },
  "datePublished": "", "dateModified": "",
  "image": "", "publisher": { "@type": "Organization", "name": "", "logo": { "@type": "ImageObject", "url": "" } }
}
```

**Product + Offer:**
```json
{
  "@context": "https://schema.org", "@type": "Product",
  "name": "", "image": "", "description": "",
  "brand": { "@type": "Brand", "name": "" },
  "offers": { "@type": "Offer", "url": "", "priceCurrency": "USD", "price": "", "availability": "https://schema.org/InStock" }
}
```

---

## 5. Sitemaps

### Validation
- Valid XML, <50K URLs per file
- All URLs return HTTP 200
- No noindexed, redirected, or non-canonical URLs
- `<lastmod>` dates are real (not all identical/current timestamp)
- `<priority>` and `<changefreq>` are **ignored by Google** — can omit
- Referenced in robots.txt
- Compare crawled pages vs sitemap — flag missing pages

### Generation Rules
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page</loc>
    <lastmod>2026-03-11</lastmod>
  </url>
</urlset>
```

For >50K URLs, use sitemap index:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap-pages.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap-posts.xml</loc></sitemap>
</sitemapindex>
```

### Penalty Risks at Scale
- Location pages with only city name swapped
- "[Competitor] alternative" without real comparison data
- AI-generated pages without unique value

---

## 6. Hreflang & International SEO

### Implementation Methods
1. **HTML `<link>` tags** — simple, <50 language versions
2. **HTTP headers** — for non-HTML files (PDFs)
3. **XML sitemap** — recommended for large/cross-domain setups

### Validation Checklist
- [ ] **Self-referencing**: every page hreflang-links to itself
- [ ] **Bidirectional**: if A→B exists, B→A must exist
- [ ] **x-default**: designates fallback for unmatched languages
- [ ] **Language codes**: ISO 639-1 (`en`, `ru`, `ja` — NOT `eng`, `jp`)
- [ ] **Region codes**: ISO 3166-1 Alpha-2 (`en-US`, `en-GB`, `pt-BR` — NOT `en-uk`)
- [ ] **Canonical alignment**: hreflang only on canonical URLs
- [ ] **Protocol consistency**: all HTTPS or all HTTP, never mixed
- [ ] **URL match**: hreflang URLs match canonical URLs exactly (trailing slash, params)

### Common Mistakes

| Issue | Severity |
|-------|----------|
| Missing self-referencing tag | Critical |
| Missing return tags (A→B but no B→A) | Critical |
| Missing x-default | High |
| Invalid language code (`eng` instead of `en`) | High |
| Invalid region code (`en-uk` instead of `en-GB`) | High |
| Hreflang on non-canonical URL | High |
| `zh` without region qualifier | Medium |
| Hreflang route doesn't exist (404) | Critical |

---

## 7. Internal Linking

### Audit
- **Orphan pages**: no internal links pointing to them — invisible to crawlers
- **Link distribution**: average links per page, identify extremes
- **Under-linked important pages**: high-traffic pages with few inlinks
- **Anchor text**: descriptive, keyword-relevant (not "click here")
- **Broken internal links**: 404s waste crawl budget and link equity
- **Nofollow on internal links**: almost never appropriate

### Best Practices
- Every page reachable within 3 clicks from homepage
- Hub-and-spoke: pillar pages link to clusters, clusters link back
- Contextual links in body content > nav/footer links
- Distribute link equity to revenue/conversion pages
- New content should be linked from existing high-authority pages

---

## 8. Audit Output Format

### Score Card
```
Overall: XX/100

Technical:        XX/100  ████████░░
On-Page:          XX/100  ██████████
Images:           XX/100  ███████░░░
Structured Data:  XX/100  █████░░░░░
Sitemap:          XX/100  ████████░░
Hreflang:         XX/100  ██████░░░░
Internal Links:   XX/100  ████████░░
```

### Issue Triage
1. **Critical** (fix immediately): blocks indexing or causes penalties
2. **High** (fix within 1 week): significantly hurts rankings
3. **Medium** (fix within 1 month): missed opportunities
4. **Low** (backlog): minor optimizations

### Prioritized Fix Table

| # | Fix | Effort | Impact | Domain |
|---|-----|--------|--------|--------|
| 1 | ... | Low/Med/High | 🔴🔴🔴 | Technical |
| 2 | ... | Low | 🟠🟠 | On-Page |

### For Each Fix
- **What**: specific problem with affected URLs/elements
- **Why**: SEO impact explained
- **How**: code snippet or step-by-step fix
- **Verify**: how to confirm the fix worked

---

## Tools

### PageSpeed Insights API (free, no key)
```bash
curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=URL&strategy=mobile" | jq '.lighthouseResult.categories'
```

### Check robots.txt
```bash
curl -s https://example.com/robots.txt
```

### Check sitemap
```bash
curl -s https://example.com/sitemap.xml | head -50
```

### Validate structured data
```bash
# Extract JSON-LD from page
curl -s URL | grep -oP '<script type="application/ld\+json">\K[^<]+'
```

### Check HTTP headers
```bash
curl -sI https://example.com/ | grep -iE "x-frame|x-content|strict-transport|referrer-policy|content-security|cache-control"
```

### Verify hreflang
```bash
curl -s URL | grep -i hreflang
```

### Count internal links
```bash
curl -s URL | grep -oE 'href="https?://example\.com[^"]*"' | sort -u | wc -l
```

---

## Sources
Fused from: aaron-he-zhu/seo-geo-claude-skills (20 skills, 807+ installs), agricidaniel/claude-seo (14 skills, 111+ installs), seo-skills/seo-audit-skill (257 installs). Distilled to actionable checklists; removed filler, duplicate cross-references, and tool-specific integrations.
