---
name: photo-finder
description: Find and download free photos/images from multiple sources (Google via Serper, Unsplash, Pexels). License-aware, filterable by size/orientation/color. Use when the user needs stock photos, illustrations, or reference images for projects, articles, presentations, or design work.
---

# Photo Finder

Multi-source image search with download. Uses APIs you already have.

## Sources (priority order)

| Source | Key | Free Tier | Best For |
|--------|-----|-----------|----------|
| **Serper Images** | `pass api/serper2` (fallback: `api/serper`) | 2,500 queries | Google Image results, broadest coverage |
| **Unsplash** | `pass api/unsplash` | 50 req/hr | High-quality stock photography |
| **Pexels** | `pass api/pexels` | 200 req/hr | Free stock photos & videos |

Setup optional sources:
```bash
# Unsplash: https://unsplash.com/developers → New Application → Access Key
pass insert api/unsplash

# Pexels: https://www.pexels.com/api/ → Get API Key
pass insert api/pexels
```

## Quick Search

### Serper Images (primary — always available)

```bash
SERPER_API_KEY="$(pass api/serper2 2>/dev/null || pass api/serper 2>/dev/null)"

curl -s -X POST "https://google.serper.dev/images" \
  -H "X-API-KEY: $SERPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "q": "mountain landscape minimal",
    "gl": "us",
    "hl": "en",
    "num": 10
  }' | jq -r '.images[] | "## \(.title)\n\(.imageUrl)\n\(.imageWidth)x\(.imageHeight) — \(.source)\n"'
```

**Serper image filters** via query modifiers:
- Size: append `imagesize:1920x1080` or use Google operators
- Type: `filetype:png`, `filetype:jpg`
- Color: add color words to query
- License: `&tbs=il:cl` (Creative Commons), `il:ol` (commercial)

### Unsplash API

```bash
UNSPLASH_KEY="$(pass api/unsplash 2>/dev/null)"

curl -s "https://api.unsplash.com/search/photos?query=mountain+landscape&per_page=10&orientation=landscape" \
  -H "Authorization: Client-ID $UNSPLASH_KEY" | \
  jq -r '.results[] | "## \(.description // .alt_description)\n\(.urls.regular)\nFull: \(.urls.full)\n\(.width)x\(.height) by \(.user.name) — Unsplash License\n"'
```

**Unsplash params:**
- `orientation`: `landscape`, `portrait`, `squarish`
- `color`: `black_and_white`, `black`, `white`, `yellow`, `orange`, `red`, `purple`, `magenta`, `green`, `teal`, `blue`
- `order_by`: `relevant` (default), `latest`
- `per_page`: 1–30

### Pexels API

```bash
PEXELS_KEY="$(pass api/pexels 2>/dev/null)"

curl -s "https://api.pexels.com/v1/search?query=mountain+landscape&per_page=10&orientation=landscape" \
  -H "Authorization: $PEXELS_KEY" | \
  jq -r '.photos[] | "## \(.alt // "Untitled")\n\(.src.large2x)\nOriginal: \(.src.original)\n\(.width)x\(.height) by \(.photographer) — Pexels License\n"'
```

**Pexels params:**
- `orientation`: `landscape`, `portrait`, `square`
- `size`: `large`, `medium`, `small`
- `color`: hex code or name (`red`, `orange`, `yellow`, `green`, `turquoise`, `blue`, `violet`, `pink`, `brown`, `black`, `gray`, `white`)
- `per_page`: 1–80

## Download Images

```bash
# Download a single image
curl -sL -o ./photo.jpg "IMAGE_URL"

# Batch download with sequential naming
mkdir -p ./photos
i=1; for url in URL1 URL2 URL3; do
  curl -sL -o "./photos/photo_$(printf '%03d' $i).jpg" "$url"
  ((i++))
done
```

**Unsplash download tracking** (required by API terms):
```bash
# After downloading, trigger download endpoint for attribution
curl -s "https://api.unsplash.com/photos/PHOTO_ID/download" \
  -H "Authorization: Client-ID $UNSPLASH_KEY" > /dev/null
```

## Workflow

1. **Search** across available sources (try Serper first, enrich with Unsplash/Pexels if available)
2. **Present** results as markdown with preview URLs, dimensions, photographer, license
3. **Download** selected images to project dir or `/tmp/photos/`
4. **Attribute** — include photographer name and source (required for Unsplash/Pexels)

## Response Format

Present results as:

```markdown
### Results for "query"

| # | Preview | Size | Source | Photographer | License |
|---|---------|------|--------|-------------|---------|
| 1 | [view](url) | 1920×1080 | Unsplash | John Doe | Unsplash License |
| 2 | [view](url) | 2400×1600 | Pexels | Jane Smith | Pexels License |
| 3 | [view](url) | 1200×800 | Google | — | Check source |

Downloaded to: `file:///absolute/path/photos/`
```

## Licensing Quick Reference

| Source | License | Commercial Use | Attribution |
|--------|---------|---------------|-------------|
| Unsplash | [Unsplash License](https://unsplash.com/license) | ✅ Free | Appreciated, not required |
| Pexels | [Pexels License](https://www.pexels.com/license/) | ✅ Free | Not required |
| Google Images | Varies per image | ⚠️ Check each | Check each |

## Tips

- **Blog headers**: search Unsplash/Pexels first (guaranteed free license)
- **Reference/research**: Serper gives broadest coverage (all of Google Images)
- **Specific subjects**: combine sources — Serper for breadth, Unsplash for quality
- **Localized**: use `gl` param in Serper (e.g., `"gl": "kg"` for Kyrgyzstan)
- **Transparent PNGs**: Serper with `filetype:png transparent SUBJECT`
