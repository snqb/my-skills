---
name: unsplash
description: "Search, verify, and embed Unsplash/Pexels photos with zero broken images. Use when you need stock photos for UI, guides, cards, hero sections, or any visual content. Every URL is HEAD-checked before output."
---

# Unsplash — Verified Stock Photos

Search Unsplash and Pexels APIs, **verify every URL loads** (HEAD check), return only working images. Zero broken `<img>` tags.

## Setup

```bash
# Unsplash: https://unsplash.com/developers → New Application → Access Key
pass insert api/unsplash

# Pexels (backup): https://www.pexels.com/api/ → Get API Key
pass insert api/pexels
```

If neither key exists, fall back to **Serper Images** (`pass api/serper`).

---

## Core Pattern: Search + Verify

Every image URL **must** be HEAD-checked before returning to the user. This is non-negotiable.

```typescript
#!/usr/bin/env -S deno run --allow-all
/** Search + verify photos. Zero broken images. */

const UNSPLASH_KEY = "YOUR_KEY";

interface Photo {
  url: string;        // Direct image URL (use this in <img>)
  thumb: string;      // Small preview
  alt: string;
  width: number;
  height: number;
  photographer: string;
  source: "unsplash" | "pexels" | "serper";
  pageUrl: string;    // Attribution link
  id: string;
}

// ── Search ──
async function searchUnsplash(query: string, count = 10, orientation?: string): Promise<Photo[]> {
  const params = new URLSearchParams({
    query, per_page: String(count), ...(orientation && { orientation }),
  });
  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results.map((r: any) => ({
    url: `${r.urls.raw}&w=800&q=80&auto=format`,  // controlled size
    thumb: r.urls.thumb,
    alt: r.alt_description || r.description || query,
    width: r.width,
    height: r.height,
    photographer: r.user.name,
    source: "unsplash" as const,
    pageUrl: r.links.html,
    id: r.id,
  }));
}

// ── Verify ──
async function verify(url: string, timeout = 5000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(url, { method: "HEAD", signal: ctrl.signal, redirect: "follow" });
    clearTimeout(timer);
    const ct = res.headers.get("content-type") || "";
    return res.ok && ct.startsWith("image/");
  } catch {
    return false;
  }
}

async function searchAndVerify(query: string, count = 10): Promise<Photo[]> {
  const raw = await searchUnsplash(query, count + 5); // fetch extra to compensate for failures
  const checked = await Promise.all(
    raw.map(async (p) => ({ ...p, ok: await verify(p.url) }))
  );
  return checked.filter((p) => p.ok).slice(0, count);
}
```

---

## Quick Commands

### Search Unsplash

```bash
UNSPLASH_KEY="$(pass api/unsplash)"

# Basic search
curl -s "https://api.unsplash.com/search/photos?query=antalya+beach&per_page=10&orientation=landscape" \
  -H "Authorization: Client-ID $UNSPLASH_KEY" | \
  jq '[.results[] | {
    id: .id,
    url: (.urls.raw + "&w=800&q=80&auto=format"),
    thumb: .urls.thumb,
    alt: (.alt_description // .description // "photo"),
    w: .width, h: .height,
    by: .user.name,
    page: .links.html
  }]'
```

### Search Pexels (backup)

```bash
PEXELS_KEY="$(pass api/pexels)"

curl -s "https://api.pexels.com/v1/search?query=antalya+beach&per_page=10&orientation=landscape" \
  -H "Authorization: $PEXELS_KEY" | \
  jq '[.photos[] | {
    id: .id,
    url: .src.large2x,
    thumb: .src.tiny,
    alt: (.alt // "photo"),
    w: .width, h: .height,
    by: .photographer,
    page: .url
  }]'
```

### Verify a URL works

```bash
# HEAD check — must return 200 + image/* content-type
curl -sI -o /dev/null -w "%{http_code} %{content_type}" "IMAGE_URL"
# Expected: "200 image/jpeg" or "200 image/webp"
```

### Batch verify (Deno one-liner)

```bash
deno eval '
const urls = JSON.parse(Deno.readTextFileSync("/tmp/photo-urls.json"));
for (const url of urls) {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    const ct = r.headers.get("content-type") || "";
    console.log(r.ok && ct.startsWith("image/") ? `✅ ${url}` : `❌ ${r.status} ${url}`);
  } catch(e) { console.log(`❌ ERR ${url}`); }
}'
```

---

## URL Patterns (Stable, Resizable)

### Unsplash

Unsplash `raw` URLs support query params for on-the-fly resizing:

```
https://images.unsplash.com/photo-XXXXX?w=800&q=80&auto=format
                                         │     │     │
                                         │     │     └─ webp if browser supports
                                         │     └─ quality 1-100
                                         └─ width in pixels
```

Other params: `h=` (height), `fit=crop`, `crop=faces` (smart crop on faces).

**Always use `&auto=format`** — serves WebP to modern browsers, JPEG to old.

### Pexels

Pexels provides preset sizes:
- `src.original` — full resolution
- `src.large2x` — 940px wide (best for cards)
- `src.large` — 940px wide
- `src.medium` — 350px wide
- `src.small` — 130px wide
- `src.tiny` — 280×200 crop (thumbnails)

Custom size: `src.original` + `?auto=compress&cs=tinysrgb&w=800` 

---

## Unsplash API Params

| Param | Values | Use |
|-------|--------|-----|
| `orientation` | `landscape`, `portrait`, `squarish` | Card backgrounds → landscape |
| `color` | `black_and_white`, `black`, `white`, `yellow`, `orange`, `red`, `purple`, `magenta`, `green`, `teal`, `blue` | Match brand colors |
| `order_by` | `relevant` (default), `latest` | |
| `per_page` | 1–30 | |
| `content_filter` | `low` (default), `high` | `high` = SFW only |

---

## Workflow for Projects

### 1. Batch search for a project (e.g., travel guide)

```typescript
const RESORT_QUERIES = [
  { key: "antalya", q: "Antalya Turkey beach resort aerial" },
  { key: "istanbul", q: "Istanbul mosque skyline sunset" },
  { key: "cappadocia", q: "Cappadocia hot air balloons sunrise" },
];

for (const { key, q } of RESORT_QUERIES) {
  const photos = await searchAndVerify(q, 3);
  console.log(`${key}: ${photos.length} verified photos`);
  // Store: photos[0].url for card background
}
```

### 2. Use in React/Next.js

```tsx
{/* Always <img> for external URLs — avoids Next.js Image domain config */}
<div className="relative h-[220px] rounded-2xl overflow-hidden">
  <img
    src="https://images.unsplash.com/photo-XXXXX?w=800&q=80&auto=format"
    alt="Antalya beach"
    className="absolute inset-0 w-full h-full object-cover"
    loading="lazy"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
  <div className="relative z-10 p-4 flex flex-col justify-end h-full">
    <h3 className="text-white font-bold">Анталья</h3>
  </div>
</div>
```

### 3. Verify before commit

Run this before deploying any page with external images:

```bash
#!/usr/bin/env -S deno run --allow-net --allow-read
/** Verify all external image URLs in a TypeScript/TSX file */
const file = Deno.args[0];
const text = await Deno.readTextFile(file);
const urls = [...text.matchAll(/https?:\/\/[^\s"'`]+\.(?:jpg|jpeg|png|webp|gif)[^\s"'`]*/gi)]
  .map(m => m[0].replace(/[),;'"]+$/, ""));

let broken = 0;
for (const url of [...new Set(urls)]) {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    const ct = r.headers.get("content-type") || "";
    if (!r.ok || !ct.startsWith("image/")) {
      console.log(`❌ ${r.status} ${url}`);
      broken++;
    } else {
      console.log(`✅ ${url.substring(0, 80)}...`);
    }
  } catch { console.log(`❌ FAIL ${url}`); broken++; }
}
console.log(`\n${urls.length} URLs checked, ${broken} broken`);
Deno.exit(broken > 0 ? 1 : 0);
```

Usage: `deno run --allow-net --allow-read /tmp/verify-images.ts src/data/guide-photos.ts`

---

## Fallback Chain

If Unsplash key not available:
1. **Pexels** (`pass api/pexels`)
2. **Serper Images** (`pass api/serper`) — Google Images, license varies
3. **Wikimedia Commons** — `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=FILE_QUERY&prop=imageinfo&iiprop=url&format=json`

---

## Attribution

| Source | Required? | How |
|--------|-----------|-----|
| Unsplash | Appreciated (not required) | `Photo by [Name] on Unsplash` |
| Pexels | Not required | `Photo by [Name] on Pexels` |
| Serper/Google | ⚠️ Check each | Varies — look at source site license |

Unsplash API terms: trigger download endpoint after use:
```bash
curl -s "https://api.unsplash.com/photos/PHOTO_ID/download" \
  -H "Authorization: Client-ID $UNSPLASH_KEY" > /dev/null
```

---

## Anti-Patterns

| ❌ Don't | ✅ Do |
|---------|------|
| Use URLs without HEAD-checking | Verify every URL before embedding |
| Hotlink `source.unsplash.com` (deprecated) | Use `images.unsplash.com` with params |
| Use full-res originals (5MB+) | Resize: `?w=800&q=80&auto=format` |
| Skip `loading="lazy"` | Always lazy-load below fold |
| Use Next.js `<Image>` for external URLs | Use `<img>` — avoids domain whitelist pain |
| Trust URLs from weeks ago | Re-verify before deploy — URLs can die |
