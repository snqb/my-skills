# HN Research Skill

Research Hacker News trends, sentiment, and discussions using Algolia HN API.

## What It Does

- **Trend Discovery** - Find what's hot on HN right now
- **Topic Research** - Deep dive into specific technologies/topics
- **Sentiment Analysis** - See what HN thinks (via comments)
- **Time-based Analysis** - Track interest over time
- **Multi-topic Comparison** - Compare technologies side-by-side
- **Show HN Discovery** - Find interesting projects

## When to Use

Use this skill when you want to:
- Check if HN has discussed your idea before
- Gauge community sentiment about a technology
- Find quality resources on a topic
- See what's trending in your tech stack
- Research before building something
- Stay current with tech trends

## Quick Examples

### What's trending now?
```
What's on HN front page right now?
```

### Topic research
```
What does HN think about Rust?
What are recent discussions about AI coding?
Show me top posts about Elixir from last month
```

### Sentiment check
```
What's HN's opinion on Cursor IDE?
Find comments about Claude Code
```

### Discovery
```
Show me recent Show HN posts
Find popular Ask HN from this week
```

## How It Works

Uses Algolia's HN API to:
1. Search stories by relevance (popular) or date (recent)
2. Filter by tags (show_hn, ask_hn, front_page, etc.)
3. Apply filters (points threshold, date ranges)
4. Extract comments for sentiment analysis
5. Format results cleanly

## Output Format

Results include:
- Points score (popularity)
- Title
- URL (or HN discussion link)
- Optional: date, author, comment text

All formatted for easy scanning and decision-making.

## Advanced Features

- **Multi-query searches** - Compare multiple topics
- **Time-series analysis** - Track trends over days/weeks/months
- **Domain filtering** - See which sites HN favors
- **User tracking** - Follow specific HN contributors
- **Comment extraction** - Deep sentiment analysis

## Integration with Your Workflow

Perfect for:
- Pre-project research ("has this been built?")
- Technology evaluation ("is X better than Y?")
- Trend validation ("is this growing or fading?")
- Learning from failures ("what went wrong with X?")
- Finding quality content for specific topics

## Examples from Your Stack

```
What does HN think about Railway vs Coolify?
Recent Elixir + Ash framework discussions
Show me top n8n automation posts
Compare Rust vs Go for systems programming
```

The skill accounts for both recency (what's new) and popularity (what's valued), giving you a complete picture of HN's perspective.
