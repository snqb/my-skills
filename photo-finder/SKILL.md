---
name: photo-finder
description: "Search, verify, and download free photos from Unsplash, Pexels, and Google (Serper). Every URL is HEAD-checked before embedding — zero broken images. Use when the user needs stock photos, illustrations, or reference images for projects, articles, UI, hero sections, or any visual content."
---

# Photo Finder

Multi-source image search. Every URL verified before output.

## Sources (priority order)

| Source | Key | Free Tier | Best For |
|--------|-----|-----------|----------|
| **Unsplash** | `pass api/unsplash` | 50 req/hr | High-quality stock photography |
| **Pexels** | `pass api/pexels` | 200 req/hr | Free stock photos & videos |
| **Serper Images** | `pass api/serper2` (fallback: `api/serper`) | 2,500 queries | Google Images, broadest coverage |

```bash
# Setup (optional — Serper is usually already configured)
pass insert api/unsplash   # https://unsplash.com/developers
pass insert api/pexels     # https://www.pexels.com/api/
```

## Core Rule: Verify Every URL

Every image URL **must** pass a HEAD check before returning to the user. Non-negotiable.

```bash
# Verify a single URL — must return 200 + image/* content-type
curl -sI -o /dev/null -w "%{http_code} %{content_type}" "IMAGE_URL"
# Expected: "200 image/jpeg" or "200 image/webp"
```

```typescript
async function verify(url: string, timeout = 5000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    const res = await fetch(url, { method: "HEAD", signal: ctrl.signal, redirect: "follow" });
    clearTimeout(timer);
    return res.ok && (res.headers.get("content-type") || "").startsWith("image/");
  } catch { return false; }
}
```

Always fetch extra results to compensate for failures, then filter to verified only.

---

## Quick Search

### Unsplash (best quality)

```bash
UNSPLASH_KEY="$(pass api/unsplash 2>/dev/null)"

curl -s "https://api.unsplash.com/search/photos?query=antalya+beach&per_page=10&orientation=landscape" \
  -H "Authorization: Client-ID $UNSPLASH_KEY" | \
  jq '[.results[] | {
    url: (.urls.raw + "&w=800&q=80&auto=format"),
    thumb: .urls.thumb,
    alt: (.alt_description // .description // "photo"),
    w: .width, h: .height,
    by: .user.name,
    page: .links.html
  }]'
```

**Params:** `orientation` (landscape/portrait/squarish), `color` (black_and_white, teal, orange, etc.), `order_by` (relevant/latest), `per_page` (1–30), `content_filter` (low/high)

**URL resizing:** `?w=800&q=80&auto=format` — controlled size, auto WebP. Also: `h=`, `fit=crop`, `crop=faces`.

**Always use `&auto=format`** — serves WebP to modern browsers.

### Pexels (backup, generous limits)

```bash
PEXELS_KEY="$(pass api/pexels 2>/dev/null)"

curl -s "https://api.pexels.com/v1/search?query=antalya+beach&per_page=10&orientation=landscape" \
  -H "Authorization: $PEXELS_KEY" | \
  jq '[.photos[] | {
    url: .src.large2x,
    thumb: .src.tiny,
    alt: (.alt // "photo"),
    w: .width, h: .height,
    by: .photographer,
    page: .url
  }]'
```

**Preset sizes:** `src.original`, `src.large2x` (940px, best for cards), `src.large`, `src.medium` (350px), `src.small`, `src.tiny` (280×200 crop)

**Params:** `orientation` (landscape/portrait/square), `size` (large/medium/small), `color` (hex or name), `per_page` (1–80)

### Serper Images (broadest coverage)

```bash
SERPER_API_KEY="$(pass api/serper2 2>/dev/null || pass api/serper 2>/dev/null)"

curl -s -X POST "https://google.serper.dev/images" \
  -H "X-API-KEY: $SERPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q": "mountain landscape", "gl": "us", "num": 10}' | \
  jq -r '.images[] | "## \(.title)\n\(.imageUrl)\n\(.imageWidth)x\(.imageHeight) — \(.source)\n"'
```

**Filters via query:** `imagesize:1920x1080`, `filetype:png`, `filetype:jpg`
**License:** `&tbs=il:cl` (Creative Commons), `il:ol` (commercial)
**Localized:** `"gl": "kg"` for Kyrgyzstan, etc.

---

## Download

```bash
# Single image
curl -sL -o ./photo.jpg "IMAGE_URL"

# Batch download
mkdir -p ./photos
i=1; for url in URL1 URL2 URL3; do
  curl -sL -o "./photos/photo_$(printf '%03d' $i).jpg" "$url"
  ((i++))
done

# Unsplash download tracking (required by API terms)
curl -s "https://api.unsplash.com/photos/PHOTO_ID/download" \
  -H "Authorization: Client-ID $UNSPLASH_KEY" > /dev/null
```

---

## Use in React/Next.js

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
</div>
```

---

## Verify Before Deploy

```bash
#!/usr/bin/env -S deno run --allow-net --allow-read
/** Verify all external image URLs in source files */
const file = Deno.args[0];
const text = await Deno.readTextFile(file);
const urls = [...text.matchAll(/https?:\/\/[^\s"'`]+\.(?:jpg|jpeg|png|webp|gif)[^\s"'`]*/gi)]
  .map(m => m[0].replace(/[),;'"]+$/, ""));
let broken = 0;
for (const url of [...new Set(urls)]) {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    const ok = r.ok && (r.headers.get("content-type") || "").startsWith("image/");
    console.log(ok ? `✅ ${url.substring(0, 80)}` : `❌ ${r.status} ${url}`);
    if (!ok) broken++;
  } catch { console.log(`❌ FAIL ${url}`); broken++; }
}
console.log(`\n${urls.length} URLs, ${broken} broken`);
```

---

## Licensing

| Source | Commercial Use | Attribution |
|--------|---------------|-------------|
| Unsplash | ✅ Free | Appreciated, not required |
| Pexels | ✅ Free | Not required |
| Google Images | ⚠️ Varies | Check each source |

## Fallback Chain

Unsplash key missing → Pexels → Serper Images → Wikimedia Commons:
```
https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=FILE_QUERY&prop=imageinfo&iiprop=url&format=json
```

## Anti-Patterns

| ❌ Don't | ✅ Do |
|---------|------|
| Embed URLs without verifying | HEAD-check every URL |
| Use full-res originals (5MB+) | Resize: `?w=800&q=80&auto=format` |
| Skip `loading="lazy"` | Always lazy-load below fold |
| Use Next.js `<Image>` for external URLs | Use `<img>` — no domain whitelist pain |
| Trust URLs from weeks ago | Re-verify before deploy |
| Hotlink `source.unsplash.com` (deprecated) | Use `images.unsplash.com` with params |
