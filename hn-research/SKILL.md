---
name: hn-research
description: Research Hacker News using Algolia API. Find trending topics, gauge community sentiment, discover what's hot, filter by recency/popularity. Perfect for tech trend analysis.
---

# HN Research Skill - Hacker News Intelligence

## Core Purpose

Use Algolia HN API to research what Hacker News is discussing, trending, or thinking about any topic. Get both stories AND comments for full sentiment analysis.

## API Endpoints

**Search by relevance (popularity):**
```
https://hn.algolia.com/api/v1/search?query=TOPIC&tags=TAG&hitsPerPage=N
```

**Search by date (recency):**
```
https://hn.algolia.com/api/v1/search_by_date?query=TOPIC&tags=TAG&hitsPerPage=N
```

## Common Filters

### Tags
- `story` - Stories only
- `comment` - Comments only (for sentiment)
- `show_hn` - Show HN posts
- `ask_hn` - Ask HN posts
- `front_page` - Front page stories
- Combine with comma: `story,front_page`

### Numeric Filters
```bash
# Posts from last 7 days
numericFilters=created_at_i>$(date -v-7d +%s)

# Posts from last 30 days
numericFilters=created_at_i>$(date -v-30d +%s)

# Posts with 100+ points
numericFilters=points>100

# Combine filters (AND)
numericFilters=created_at_i>TIMESTAMP,points>100
```

### Pagination
- `hitsPerPage=N` - Results per page (max 1000)
- Use `page=N` for pagination

## Research Patterns

### Pattern 1: What's Trending Now?

**Front page (all topics):**
```bash
curl -s "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30" | \
  jq -r '.hits[] | "\(.points) pts | \(.title) | \(.url // ("https://news.ycombinator.com/item?id=" + (.objectID | tostring)))"' | \
  sort -rn
```

**Recent hot posts (last 7 days, 50+ points):**
```bash
curl -s "https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=100" | \
  jq -r '.hits[] | select(.points > 50) | "\(.points) pts | \(.created_at) | \(.title) | \(.url // ("https://news.ycombinator.com/item?id=" + (.objectID | tostring)))"' | \
  head -30
```

### Pattern 2: Topic Research

**What's HN saying about X? (popular):**
```bash
TOPIC="rust programming"
curl -s "https://hn.algolia.com/api/v1/search?query=$TOPIC&tags=story&hitsPerPage=20" | \
  jq -r '.hits[] | "\(.points) pts | \(.title) | \(.url // ("https://news.ycombinator.com/item?id=" + (.objectID | tostring)))"'
```

**Recent discussions about X:**
```bash
TOPIC="claude code"
curl -s "https://hn.algolia.com/api/v1/search_by_date?query=$TOPIC&tags=story&hitsPerPage=30" | \
  jq -r '.hits[0:15] | .[] | "\(.points) pts | \(.created_at) | \(.title) | \(.url // ("https://news.ycombinator.com/item?id=" + (.objectID | tostring)))"'
```

### Pattern 3: Sentiment Analysis (Comments)

**What are people saying about X?:**
```bash
TOPIC="cursor IDE"
curl -s "https://hn.algolia.com/api/v1/search?query=$TOPIC&tags=comment&hitsPerPage=30" | \
  jq -r '.hits[] | select(.points > 3) | "[\(.points) pts] \(.author): \(.comment_text[0:200])..."'
```

**Top comments on a story:**
```bash
STORY_ID="46420670"
curl -s "https://hn.algolia.com/api/v1/search?tags=comment,story_$STORY_ID&hitsPerPage=20" | \
  jq -r '.hits[] | "[\(.points) pts] \(.author):\n\(.comment_text)\n---"'
```

### Pattern 4: Show HN / Ask HN

**Recent Show HN posts:**
```bash
curl -s "https://hn.algolia.com/api/v1/search_by_date?tags=show_hn&hitsPerPage=30" | \
  jq -r '.hits[0:20] | .[] | "\(.points) pts | \(.title) | \(.url // ("https://news.ycombinator.com/item?id=" + (.objectID | tostring)))"'
```

**Popular Ask HN (last month):**
```bash
curl -s "https://hn.algolia.com/api/v1/search?tags=ask_hn&hitsPerPage=30" | \
  jq -r '.hits[] | select(.points > 20) | "\(.points) pts | \(.title) | https://news.ycombinator.com/item?id=\(.objectID)"'
```

### Pattern 5: Multi-Topic Research

**Compare interest in multiple topics:**
```bash
for topic in "rust" "go" "zig" "elixir"; do
  echo "=== $topic ==="
  curl -s "https://hn.algolia.com/api/v1/search_by_date?query=$topic&tags=story&hitsPerPage=10" | \
    jq -r '.hits[0:5] | .[] | select(.points > 30) | "\(.points) pts | \(.title)"'
  echo
done
```

### Pattern 6: User Research

**Find posts by user:**
```bash
USER="patio11"
curl -s "https://hn.algolia.com/api/v1/search?tags=author_$USER&hitsPerPage=20" | \
  jq -r '.hits[] | "\(.points) pts | \(.title // .comment_text[0:100])"'
```

## Response Format

```json
{
  "hits": [
    {
      "objectID": "46420670",
      "title": "Post title",
      "url": "https://example.com",
      "author": "username",
      "points": 250,
      "num_comments": 42,
      "created_at": "2025-12-29T13:22:59Z",
      "created_at_i": 1735481579,
      "story_text": null,  // for Ask HN
      "comment_text": null // for comments
    }
  ],
  "nbHits": 1000,
  "page": 0,
  "nbPages": 50
}
```

## Useful Filters

### Date Helpers
```bash
# Last 24 hours
date -v-24H +%s

# Last 7 days
date -v-7d +%s

# Last 30 days
date -v-30d +%s

# Last year
date -v-1y +%s
```

### JQ Helpers

**Top posts only:**
```bash
jq -r '.hits[] | select(.points > 100) | ...'
```

**Sort by points:**
```bash
jq -r '.hits | sort_by(.points) | reverse | .[] | ...'
```

**Filter by date:**
```bash
jq -r '.hits[] | select(.created_at_i > 1735000000) | ...'
```

**Extract domains:**
```bash
jq -r '.hits[] | .url | select(. != null) | sub("https?://([^/]+).*"; "\\1")'
```

## Complete Research Workflow

### 1. Topic Discovery (What's hot?)
```bash
# Front page snapshot
curl -s "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30" | \
  jq -r '.hits[] | "\(.points)|\(.title)|\(.url // ("HN:" + .objectID))"' | \
  sort -rn | column -t -s'|'
```

### 2. Deep Dive (Specific topic)
```bash
TOPIC="your_topic"

# Stories
echo "=== Stories ==="
curl -s "https://hn.algolia.com/api/v1/search?query=$TOPIC&tags=story&hitsPerPage=20" | \
  jq -r '.hits[] | "\(.points) pts | \(.title) | \(.url // ("https://news.ycombinator.com/item?id=" + .objectID))"'

# Recent discussion
echo -e "\n=== Recent ==="
curl -s "https://hn.algolia.com/api/v1/search_by_date?query=$TOPIC&tags=story&hitsPerPage=20" | \
  jq -r '.hits[0:10] | .[] | "\(.points) pts | \(.created_at) | \(.title)"'
```

### 3. Sentiment Check (Comments)
```bash
TOPIC="your_topic"
curl -s "https://hn.algolia.com/api/v1/search?query=$TOPIC&tags=comment&hitsPerPage=50" | \
  jq -r '.hits[] | select(.points > 2) | "[\(.points)pts] \(.author): \(.comment_text)"' | \
  head -20
```

### 4. Trend Analysis (Over time)
```bash
TOPIC="AI coding"
for period in "24H" "7d" "30d"; do
  echo "=== Last $period ==="
  TIMESTAMP=$(date -v-$period +%s)
  curl -s "https://hn.algolia.com/api/v1/search?query=$TOPIC&tags=story&numericFilters=created_at_i>$TIMESTAMP&hitsPerPage=100" | \
    jq -r '.nbHits'
done
```

## When to Use This Skill

Use HN research when you want to:
- **Discover trends** - What's HN talking about lately?
- **Gauge sentiment** - What does HN think about X?
- **Find alternatives** - "X vs Y" discussions
- **Learn from discussions** - Comment threads on specific topics
- **Track topics over time** - Is interest growing/fading?
- **Find quality content** - High-scoring posts on topic
- **Research before building** - Has this been done? What went wrong?

## Output Formatting

**Clean list:**
```bash
jq -r '.hits[] | "\(.points) pts | \(.title) | \(.url // ("https://news.ycombinator.com/item?id=" + .objectID))"'
```

**With date:**
```bash
jq -r '.hits[] | "\(.points) pts | \(.created_at) | \(.title) | \(.url // ("https://news.ycombinator.com/item?id=" + .objectID))"'
```

**Markdown links:**
```bash
jq -r '.hits[] | "- **[\(.title)](\(.url // ("https://news.ycombinator.com/item?id=" + .objectID)))** (\(.points) pts)"'
```

**CSV export:**
```bash
jq -r '.hits[] | [.points, .title, .url, .created_at] | @csv'
```

## Pro Tips

1. **Combine searches** - Run multiple queries for comprehensive view
2. **Check comments** - Stories show what's posted, comments show what people think
3. **Filter aggressively** - HN has noise, use `points > N` liberally
4. **Time matters** - Recent search vs popular search give different insights
5. **Domain analysis** - See which sites HN favors for topic
6. **Author stalking** - Find experts by tracking their HN activity

## Common Queries

**"What does HN think about X?"**
```bash
# Stories + top comments
TOPIC="cursor IDE"
echo "=== Stories ===" && \
curl -s "https://hn.algolia.com/api/v1/search?query=$TOPIC&tags=story&hitsPerPage=10" | \
  jq -r '.hits[] | "\(.points) pts | \(.title)"'
echo -e "\n=== Sentiment ===" && \
curl -s "https://hn.algolia.com/api/v1/search?query=$TOPIC&tags=comment&hitsPerPage=30" | \
  jq -r '.hits[] | select(.points > 5) | "[\(.points)] \(.comment_text[0:150])..."' | head -10
```

**"What's trending in X?"**
```bash
TOPIC="rust"
curl -s "https://hn.algolia.com/api/v1/search_by_date?query=$TOPIC&tags=story&hitsPerPage=30" | \
  jq -r '.hits[0:15] | .[] | select(.points > 20) | "\(.points) pts | \(.created_at) | \(.title)"'
```

**"Show me good Show HN projects"**
```bash
curl -s "https://hn.algolia.com/api/v1/search?tags=show_hn&hitsPerPage=50" | \
  jq -r '.hits[] | select(.points > 100) | "\(.points) pts | \(.title) | \(.url)"'
```

## Error Handling

**API returns 400:**
- Check `numericFilters` syntax (no parentheses in bash!)
- Use direct timestamps instead of `$(date ...)` inline

**Empty results:**
- Try broader query terms
- Lower `points >` threshold
- Increase `hitsPerPage`
- Check spelling

**jq parse errors:**
- Ensure proper quoting in jq filters
- Test jq expression separately first

## Example: Complete Tech Stack Research

```bash
#!/bin/bash
# Research multiple technologies, compare HN interest

TOPICS=("rust" "go" "elixir" "zig")

echo "=== HN Tech Stack Comparison (Last 30 days) ==="
for topic in "${TOPICS[@]}"; do
  echo -e "\n## $topic"

  # Story count
  COUNT=$(curl -s "https://hn.algolia.com/api/v1/search_by_date?query=$topic&tags=story&hitsPerPage=100" | jq '.nbHits')
  echo "Stories: $COUNT"

  # Top posts
  echo "Top posts:"
  curl -s "https://hn.algolia.com/api/v1/search?query=$topic&tags=story&hitsPerPage=5" | \
    jq -r '.hits[0:3] | .[] | "  • \(.points) pts - \(.title)"'
done
```

This skill makes you HN-literate. Use it before building, to validate ideas, find prior art, gauge community reception, or just stay informed.
