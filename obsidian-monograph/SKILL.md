---
name: obsidian-monograph
description: "Research and write deep-dive monograph articles for an Obsidian vault. Multi-source research → Gwern-voice prose → Wikipedia links → Wikimedia Commons images → footnotes. Use when asked to write an article, deep dive, or create a read about any topic for the vault."
---

# Obsidian Monograph

End-to-end pipeline: research a topic deeply, then write a long-form article for a personal Obsidian knowledge vault.

**Configure**: Set `OBSIDIAN_VAULT` env var or default to `~/obsidian/obs/`.

## When to Load

- "write about X for obsidian"
- "deep dive into X"
- "create an article / read / monograph about X"
- "research X and write it up"
- Any request that ends with output to the vault

## Vault Location & Folders

```
$OBSIDIAN_VAULT/         ← Obsidian vault root (default: ~/obsidian/obs/)
├── AI/                  ← Tech, CS, ML, software (English)
├── Геополитика/         ← Geopolitics, intelligence, revolutions (Russian)
├── Ислам/               ← Islam, Quran, Prophet (Russian)
├── Кыргызстан/          ← Kyrgyz history, culture (Russian)
└── Химия/               ← Chemistry, cosmetics (Russian)
```

Pick the right folder. If none fits, create a new one (Russian name for Russian topics, English for English topics). Tech topics default to `AI/`. Adapt folder structure to your vault.

## Phase 1: Research

Hit **at least 3 sources**. The goal is real facts with clickable provenance, not vibes.

### 1a. Web Search (Serper)

```bash
SERPER_API_KEY="$(pass api/serper2 2>/dev/null || pass api/serper 2>/dev/null)"

# Broad search
curl -s -X POST "https://google.serper.dev/search" \
  -H "X-API-KEY: $SERPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q": "TOPIC specific query", "num": 10}' | \
  jq -r '.organic[] | "## \(.title)\n\(.link)\n\(.snippet)\n"'

# Scholar (for academic grounding)
curl -s -X POST "https://google.serper.dev/scholar" \
  -H "X-API-KEY: $SERPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q": "TOPIC academic", "num": 5}' | \
  jq -r '.organic[] | "\(.title) (\(.year))\n\(.link)\n\(.snippet)\n"'
```

Run **3-6 searches** with different angles: overview, key players, history, technology, criticism, market data.

### 1b. Hacker News (sentiment + community knowledge)

```bash
# Stories
curl -s "https://hn.algolia.com/api/v1/search?query=TOPIC&tags=story&hitsPerPage=20" | \
  jq -r '.hits[] | "\(.points) pts | \(.num_comments) comments | \(.title) | \(.url // ("https://news.ycombinator.com/item?id=" + .objectID))"'

# Comments (the real gold — practitioner opinions)
curl -s "https://hn.algolia.com/api/v1/search?query=TOPIC&tags=comment&hitsPerPage=30" | \
  jq -r '.hits[] | select(.points > 3) | "[\(.points) pts] \(.author): \(.comment_text[0:200])..."'
```

HN is optional for non-tech topics but invaluable for tech. Use it whenever the topic overlaps with HN interests.

### 1c. Session History (if user mentions prior research)

```bash
rg -li "KEYWORD" ~/.pi/agent/sessions/**/*.jsonl 2>/dev/null | head -10
```

Extract assistant text content from the session to avoid re-researching.

### 1d. Collect Raw Facts

From all sources, extract:
- **Names** of people, companies, projects (for Wikipedia links)
- **Numbers** — dollars, dates, percentages, market sizes (for footnotes)
- **Quotes** — direct quotes from HN comments, articles (for color)
- **URLs** — every source URL for footnotes
- **Relationships** — who acquired whom, who works where, what depends on what

## Phase 2: Images

Find 2-5 relevant Wikimedia Commons images.

```bash
# Search
QUERY="URL_ENCODED_SEARCH_TERM"
curl -s "https://commons.wikimedia.org/w/api.php?\
action=query&list=search&srsearch=$QUERY&srnamespace=6&srlimit=5&format=json" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); [print(r['title']) for r in d['query']['search']]"

# Get thumb URL + license
TITLE="File:Example.jpg"
TITLE_ENC=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$TITLE'))")
curl -s "https://commons.wikimedia.org/w/api.php?\
action=query&titles=$TITLE_ENC&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&format=json" | \
  python3 -c "
import json, sys
d = json.load(sys.stdin)
for pid, page in d.get('query',{}).get('pages',{}).items():
    ii = page.get('imageinfo',[{}])[0]
    meta = ii.get('extmetadata',{})
    print(f'thumb: {ii.get(\"thumburl\") or ii.get(\"url\",\"\")}')
    print(f'commons: {ii.get(\"descriptionurl\",\"\")}')
    print(f'license: {meta.get(\"LicenseShortName\",{}).get(\"value\",\"unknown\")}')
"
```

Embed format:
```markdown
![Descriptive alt text](THUMB_URL)
*Caption — what/who/when. [Wikimedia Commons](COMMONS_URL), LICENSE*
```

Rules:
- External URLs only (vault stays light for mobile sync)
- Use 800px thumbs, not full resolution
- Always include caption with attribution
- Prefer: portraits of mentioned people, photos of discussed places/events
- License priority: Public domain > CC0 > CC BY > CC BY-SA. Skip "fair use"

## Phase 3: Write

### Voice

Gwern Branwen, Scott Alexander, early Paul Graham. A person thinking on paper.

- **Generous with words.** Tangents welcome if they add context. 1500-3000 words per major section.
- **Think out loud.** "This is worth pausing on." "Notice what happened here." "The irony is..."
- **Concrete over abstract.** Names, dates, dollar amounts, quotes. Never "experts say" — say *which* expert.
- **Dry wit.** Not jokes — just a human noticing absurdity.
- **Total article: 2500-5000 words.** These are deep reads, not blog posts.

### Structure

```markdown
---
tags: [topic-tag-1, topic-tag-2, ...]
date: YYYY-MM-DD
---

# Title — plain, descriptive

> Opening line or quote — sets tone, not summary

---

## Section heading

Prose paragraphs. Tables for comparisons/data.

![Image](url)
*Caption. [Wikimedia Commons](url), license*

Footnotes inline[^1] → collected at end.

## Another section

More prose. More tables if needed.

---

## References

[^1]: Author, [Title](URL), *Publication*, Date.
[^2]: ...

## Related

- [[Other vault note]] — cross-references
```

### Wikipedia Links

First mention of any notable entity → wrap in `[entity](wikipedia_url)`.

- People, organizations, events, places, concepts, technologies
- Russian articles → ru.wikipedia.org first, en.wikipedia.org fallback
- English articles → en.wikipedia.org first
- Don't link common words. Don't link the same entity twice.
- Target: ~20-40 links per long article

### Footnotes

Every factual claim that has a specific number, quote, or contestable fact → footnote.

```markdown
The market reached **$619.8 million** in 2025.[^2]

[^2]: [Football Analysis Software Market Report 2026](https://url), Archive Market Research.
```

Each footnote has: author/publication (if available), direct URL (clickable), date.
Target: 15-25 footnotes per article.

### Language

| Topic domain | Language |
|---|---|
| Tech, CS, software, ML | English |
| Kyrgyz/Russian/CIS geopolitics | Russian |
| Islam, Central Asian history | Russian |
| Chemistry, everyday science | Russian |
| Mixed / unclear | Follow user's lead |

## Phase 4: Quality Check

Before saving, verify:

```bash
FILE="path/to/article.md"

# Word count (target: 2500-5000)
wc -w "$FILE"

# Forbidden patterns (must be 0)
grep -n "Additionally\|Furthermore\|It's worth noting\|>\s*\[!" "$FILE"

# Footnote count (target: 15-25)
grep -c '^\[^' "$FILE"

# Wikipedia links (target: 20-40)
grep -co 'wikipedia.org' "$FILE"

# Image count (target: 2-5)
grep -c '^!\[' "$FILE"
```

### Absolutely Forbidden

- `> [!note]` / `> [!important]` callout boxes
- `**Term:** explanation` bold-header bullet lists
- Mermaid `mindmap` / `journey` / `gantt` (break mobile)
- Emoji in headers
- "Additionally", "Furthermore", "It's worth noting", "It's important to note"
- "This underscores", "the future looks bright"
- Rule-of-three ("innovation, inspiration, and insight")
- Synonym cycling (protagonist → main character → central figure)
- Em dash abuse (more than 3-4 per article)
- Generic promotional conclusions
- LaTeX wrapped in code fences (use raw `$$` and `$`)

### Allowed Formatting

- Tables (great for comparisons, timelines, data grids)
- `graph`/`flowchart` Mermaid (if genuinely useful — rare)
- Code blocks (for commands, data samples, API examples)
- `[[wikilinks]]` for cross-references to other vault notes
- Horizontal rules `---` for section breaks

## Phase 5: Save

```bash
# Save to correct folder
# English tech → $OBSIDIAN_VAULT/AI/
# Russian geopolitics → $OBSIDIAN_VAULT/Геополитика/
# etc.
```

Print clickable path:
```
file://$OBSIDIAN_VAULT/AI/Article%20Title.md
```

## Quick Reference: Research Queries Per Topic Type

| Topic type | Serper queries | HN? | Scholar? |
|---|---|---|---|
| Software/tech | 4-6 (overview, players, comparison, market, history, criticism) | Yes, stories + comments | Optional |
| Geopolitics | 3-5 (events, players, analysis, primary sources) | Rarely useful | Sometimes |
| Science | 3-4 (explainer, research, applications) | Sometimes | Yes |
| History | 3-5 (events, biography, analysis, primary sources) | Rarely | Sometimes |
| Industry/market | 4-6 (market size, players, technology, case studies, trends) | Yes if tech-adjacent | Optional |

## Dependencies (Skills Used)

These skills may be loaded during the workflow — don't re-read this skill's instructions, they're self-contained above:

| Skill | When | What for |
|---|---|---|
| `serper-search` | Phase 1 | API key retrieval pattern |
| `hn-research` | Phase 1 | HN Algolia API patterns |
| `session-finder` | Phase 1 | Finding prior research |
| `humanizer` | Phase 4 | Cross-check against AI-slop patterns |

The Wikimedia Commons API usage is fully documented above — no separate skill needed.
