---
name: serper-search
description: Fast, cheap Google search via Serper.dev. Returns real Google results as structured JSON. Use for web search, news, images, places, shopping. Requires SERPER_API_KEY or 'api/serper' in pass.
---

# Serper Search Skill

## Setup

```bash
# Store key in pass
pass insert api/serper

# Or set env
export SERPER_API_KEY=your-key
```

Get an API key at https://serper.dev (2,500 free queries to start).

## Quick Usage

```bash
SERPER_API_KEY="${SERPER_API_KEY:-$(pass api/serper2 2>/dev/null || pass api/serper 2>/dev/null)}"

# Web search
curl -s -X POST "https://google.serper.dev/search" \
  -H "X-API-KEY: $SERPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q": "SEARCH_QUERY", "num": 5}' | jq '.'
```

## Endpoints

All endpoints accept POST with JSON body. Base URL: `https://google.serper.dev`

| Endpoint | Path | Use |
|---|---|---|
| Web Search | `/search` | General web results |
| News | `/news` | News articles |
| Images | `/images` | Image results |
| Videos | `/videos` | Video results |
| Places | `/places` | Local/map results |
| Shopping | `/shopping` | Product listings |
| Scholar | `/scholar` | Academic papers |
| Autocomplete | `/autocomplete` | Search suggestions |

## Parameters

```json
{
  "q": "search query",
  "gl": "us",
  "hl": "en",
  "num": 10,
  "page": 1,
  "type": "search",
  "tbs": "qdr:d"
}
```

| Param | Description |
|---|---|
| `q` | Search query (required) |
| `gl` | Country code (us, gb, de, ru, kg...) |
| `hl` | Language (en, ru, de...) |
| `num` | Results per page (max 100) |
| `page` | Page number |
| `tbs` | Time filter: `qdr:h` (hour), `qdr:d` (day), `qdr:w` (week), `qdr:m` (month), `qdr:y` (year) |

## Search Patterns

### Web search with snippets
```bash
curl -s -X POST "https://google.serper.dev/search" \
  -H "X-API-KEY: $SERPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q": "best rust web frameworks 2026", "num": 5}' | \
  jq -r '.organic[] | "## \(.title)\n\(.link)\n\(.snippet)\n"'
```

### News search (last 24h)
```bash
curl -s -X POST "https://google.serper.dev/news" \
  -H "X-API-KEY: $SERPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q": "artificial intelligence", "num": 5, "tbs": "qdr:d"}' | \
  jq -r '.news[] | "[\(.date)] \(.title)\n\(.link)\n"'
```

### Local search
```bash
curl -s -X POST "https://google.serper.dev/places" \
  -H "X-API-KEY: $SERPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q": "coffee shops", "gl": "kg"}' | \
  jq -r '.places[] | "\(.title) — ⭐\(.rating) (\(.reviews) reviews)\n\(.address)\n"'
```

### Scholar search
```bash
curl -s -X POST "https://google.serper.dev/scholar" \
  -H "X-API-KEY: $SERPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q": "transformer architecture attention", "num": 5}' | \
  jq -r '.organic[] | "\(.title) (\(.year))\n\(.link)\n\(.snippet)\n"'
```

### Batch search (multiple queries in one request)
```bash
curl -s -X POST "https://google.serper.dev/search" \
  -H "X-API-KEY: $SERPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '[{"q": "query one", "num": 3}, {"q": "query two", "num": 3}]' | jq '.'
```

## Response Structure

```json
{
  "searchParameters": { "q": "...", "gl": "us", "hl": "en", "type": "search" },
  "knowledgeGraph": { "title": "...", "type": "...", "description": "..." },
  "organic": [
    {
      "title": "Result Title",
      "link": "https://...",
      "snippet": "Description text...",
      "position": 1,
      "sitelinks": [...]
    }
  ],
  "peopleAlsoAsk": [
    { "question": "...", "snippet": "...", "link": "..." }
  ],
  "relatedSearches": [
    { "query": "..." }
  ]
}
```

## Cost

- **Free:** 2,500 queries
- **~$0.30–1.00 per 1k queries** on paid plans
- Each API call = 1 credit regardless of `num` results

## Tips

- Use `num: 10` (default) — costs the same as `num: 1`
- Batch requests save HTTP overhead but each query still costs 1 credit
- `tbs` time filters are great for recency-sensitive searches
- `gl` + `hl` combo for localized results (e.g., `gl: "kg", hl: "ru"`)
- Response includes `knowledgeGraph` and `peopleAlsoAsk` — rich structured data for free
