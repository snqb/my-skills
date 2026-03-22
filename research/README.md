# Research Skill — Multi-Source Deep Research

A meta-skill that orchestrates 4 search engines in parallel and synthesizes results into a single structured report.

## Sources

| Engine | What it does | API key |
|---|---|---|
| **Exa** (exa.ai) | Semantic search — finds by meaning, not keywords. Deep search, structured answers, async research | `EXA_API_KEY` |
| **Serper** (serper.dev) | Google SERP as JSON — web, news, images, Scholar, Places, Shopping. Fast and cheap | `SERPER_API_KEY` |
| **GitHub** | Library/tool search with quality filters (100+ stars, active, documented) | GitHub PAT (optional; 60 req/hr without it) |
| **Hacker News** | Algolia API — trends, discussions, sentiment. Free, no key needed | None |

## How It Works

1. **Analyze request** — determines which vectors are relevant (web, code, community)
2. **Parallel execution** of the needed sources
3. **Synthesis** — assembles a structured report:
   - **Summary** — high-level answer
   - **Deep Dive** — evidence from Exa/Serper
   - **Tools** — recommendations from GitHub
   - **Community Consensus** — sentiment from HN

## When to Use What

- **Looking for a solution** → GitHub (tools) + Serper/Exa (reviews)
- **Exploring a topic** → Serper (facts) + Exa (deep content) + HN (opinions)
- **Debugging** → Serper (fixes) + GitHub (issues)
- **Exa credits exhausted** → Serper as primary fallback

## Exa — Key Features

- `type: "auto"` / `"neural"` / `"deep"` — from quick to maximally thorough
- `contents.text` — extracts page text inline with results
- `/answer` — direct answer to a question with citations
- `/research` — async agent-style research (create task, poll for result)
- `/findSimilar` — find similar pages given a URL
- Filters: domains, dates, categories (`research paper`, `news`, `tweet`, etc.)

## Serper — Key Features

- Endpoints: `/search`, `/news`, `/images`, `/scholar`, `/places`, `/shopping`
- Time filters: `tbs: "qdr:d"` (day), `qdr:w` (week), `qdr:m` (month)
- Localization: `gl` (country) + `hl` (language)
- Batch queries (array in a single POST)
- Response includes `knowledgeGraph`, `peopleAlsoAsk`

## Hacker News — Key Features

- Search by relevance (`/search`) or by date (`/search_by_date`)
- Tags: `story`, `comment`, `show_hn`, `ask_hn`, `front_page`
- Numeric filters: `points>100`, `created_at_i>TIMESTAMP`
- Comments are the main source of sentiment

## Principles

- **Cross-reference**: don't rely on a single source. Library looks great on GitHub? Check HN to see if people hate it in production.
- **Cite sources**: always attribute where the info came from.
- **Synthesize, don't dump**: don't just list links — read them and write a coherent answer.

## Setup

```bash
export EXA_API_KEY="..."        # required
export SERPER_API_KEY="..."     # required
# GitHub PAT — optional, without it rate limit is 60 req/hr
# HN — free, no key needed
```

Dashboards: [exa.ai](https://dashboard.exa.ai) | [serper.dev](https://serper.dev)
