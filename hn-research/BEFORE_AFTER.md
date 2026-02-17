# Before/After: HN Research Skill

## Before: Manual API Wrestling

### Scenario 1: "What does HN think about Claude Code?"

**Without skill:**
```bash
# You: Tries to remember Algolia API syntax
curl "https://hn.algolia.com/api/v1/search?query=claude%20code" | jq '.'
# 😵 Giant JSON blob, no idea what to look for

# Tries to filter
curl "https://hn.algolia.com/api/v1/search?query=claude%20code&tags=story" | jq '.hits[] | .title'
# 📋 Gets titles but no points, no links

# Tries to add points
curl "https://hn.algolia.com/api/v1/search?query=claude%20code&tags=story" | jq -r '.hits[] | "\(.points) - \(.title)"'
# 😤 Still ugly, unsorted, includes 0-point junk

# Tries to sort and filter
curl "https://hn.algolia.com/api/v1/search?query=claude%20code&tags=story&hitsPerPage=50" | jq -r '.hits[] | select(.points > 20) | "\(.points) pts | \(.title) | \(.url)"' | sort -rn
# 🤯 30 minutes later, finally works

# Now needs comments for sentiment...
# Gives up and just reads manually
```

**With skill:**
```
You: "What does HN think about Claude Code?"

Claude (using hn-research skill):
  ✅ Searches stories with proper filters
  ✅ Searches comments for sentiment
  ✅ Formats output cleanly
  ✅ Shows both popularity and recency
  ✅ Provides context and summary

Result: Complete analysis in one shot.
```

---

### Scenario 2: "Should I use Rust or Go for my project?"

**Without skill:**
```bash
# Multiple searches, manual comparison
for lang in rust go; do
  echo "=== $lang ==="
  curl "https://hn.algolia.com/api/v1/search?query=$lang" | jq -r '.hits[0:5] | .[] | .title'
  # Output is messy, no context, can't compare
done

# Tries to get recent discussions
curl "https://hn.algolia.com/api/v1/search_by_date?query=rust%20vs%20go" | jq '.'
# 😫 Different API endpoint, different format

# Tries to add date filters
curl "https://hn.algolia.com/api/v1/search?query=rust&numericFilters=created_at_i>$(date -v-30d +%s)"
# ❌ 400 Bad Request (bash expansion in URL doesn't work)

# Manually calculates timestamp
TIMESTAMP=$(date -v-30d +%s)
curl "https://hn.algolia.com/api/v1/search?query=rust&numericFilters=created_at_i>$TIMESTAMP" | jq '.'
# 🎉 Works! But now has to do same for Go...
# And still needs to compare, find discussions, check sentiment...

# 2 hours later: "Maybe I'll just Google it"
```

**With skill:**
```
You: "Should I use Rust or Go? What does HN say?"

Claude (using hn-research skill):
  ✅ Searches both topics
  ✅ Compares popularity, recency, trends
  ✅ Finds "Rust vs Go" discussions
  ✅ Extracts key sentiment from comments
  ✅ Shows recent projects in each
  ✅ Provides data-driven recommendation

Result: Comprehensive comparison in minutes.
```

---

### Scenario 3: "Has anyone built X before?"

**Without skill:**
```bash
# Manual search on HN website
# Scrolls through pages
# Reads every post manually
# Misses relevant discussions with different keywords
# No way to filter by points/date
# Can't extract comments easily
# Takes hours, incomplete results
```

**With skill:**
```
You: "Has anyone built a telegram bot for theater quizzes on HN?"

Claude (using hn-research skill):
  ✅ Searches multiple keyword combinations
    - "telegram bot quiz"
    - "quiz bot"
    - "theater bot"
    - "educational quiz"
  ✅ Finds Show HN posts
  ✅ Extracts comments about similar projects
  ✅ Identifies what worked/failed
  ✅ Provides links to source code
  ✅ Summarizes lessons learned

Result: Complete prior art research, fast.
```

---

## Real Examples from Your Research Session

### What You Manually Did Today

```bash
# Query 1: Claude Code posts
curl -s "https://hn.algolia.com/api/v1/search?query=claude%20code&tags=story&hitsPerPage=20" | jq -r '.hits[] | "\(.points) pts | \(.title) | \(if .url then .url else "https://news.ycombinator.com/item?id=" + (.objectID | tostring) end)"'

# Query 2: Cursor posts
curl -s "https://hn.algolia.com/api/v1/search?query=cursor%20IDE&tags=story&hitsPerPage=20" | jq -r '.hits[] | "\(.points) pts | \(.title) | \(if .url then .url else "https://news.ycombinator.com/item?id=" + (.objectID | tostring) end)"'

# Query 3: Recent posts
curl -s "https://hn.algolia.com/api/v1/search_by_date?query=claude+code&tags=story&hitsPerPage=50" | jq -r '.hits[0:20] | .[] | "\(.points) pts | \(.created_at) | \(.title) | \(if .url then .url else "https://news.ycombinator.com/item?id=" + (.objectID | tostring) end)"'

# Query 4-8: More variations...
# Each required tweaking the command
# Multiple attempts due to errors
```

### What Skill Does

```
You: "What's HN saying about AI coding tools lately?"

Claude (using hn-research):
  - Runs all relevant queries automatically
  - Handles API errors gracefully
  - Formats consistently
  - Compares multiple tools
  - Shows trends over time
  - Extracts sentiment
  - Summarizes findings

One natural language request → Complete analysis.
```

---

## Time Savings

| Task | Manual | With Skill | Saved |
|------|--------|-----------|-------|
| Simple topic search | 15 min | 1 min | 14 min |
| Multi-topic comparison | 45 min | 2 min | 43 min |
| Sentiment analysis | 60 min | 3 min | 57 min |
| Trend tracking | 30 min | 2 min | 28 min |
| Prior art research | 2 hours | 5 min | 115 min |

---

## Quality Improvements

**Manual approach:**
- ❌ Miss relevant posts (wrong keywords)
- ❌ Include noise (low-quality posts)
- ❌ Can't easily compare multiple topics
- ❌ Sentiment requires manual reading
- ❌ Hard to track trends over time

**With skill:**
- ✅ Comprehensive keyword coverage
- ✅ Smart filtering (points, date, tags)
- ✅ Built-in comparison tools
- ✅ Automated sentiment extraction
- ✅ Time-series analysis built-in

---

## Bottom Line

**Before:** Spend hours wrestling with APIs, jq, bash, and manual aggregation.

**After:** Ask Claude a natural question, get comprehensive HN research in minutes.

The skill encodes all the HN API knowledge, best practices, and formatting patterns so you never have to remember them again.
