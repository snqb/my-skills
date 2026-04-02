---
name: deep-research
description: "Iterative deep research agent — recursive breadth×depth tree search that accumulates learnings, generates follow-ups, and produces cited reports. Uses exa + serper + subagents. Use when user says 'deep research', 'investigate', 'deep dive', 'thorough analysis', or needs multi-source synthesis with depth."
user-invocable: true
argument-hint: <topic>
---

# Deep Research

Autonomous iterative research agent. Recursively explores a topic tree: generates search queries → retrieves sources → extracts learnings → generates follow-up questions → goes deeper. Each depth level halves the breadth (exponential focus). All learnings accumulate into a final cited report.

**Algorithm**: Based on dzhng/deep-research (18K⭐, by David Zhang/Aomni), fused with Exa deep search, Serper SERP, subagent parallelism, and scientific rigor from K-Dense-AI.

## When to Use

- User says "deep research", "investigate", "deep dive", "thorough analysis"
- Any question requiring 15+ sources and multi-angle synthesis
- Technology evaluations, competitive analysis, market sizing
- "What's the current state of X?" with real depth
- NOT for quick lookups (use `research` or `exa-search` directly)

## Parameters

| Param | Default | Description |
|-------|---------|-------------|
| **breadth** | 4 | Number of search queries per level (3-10) |
| **depth** | 3 | How many levels deep to recurse (1-5) |
| **topic** | required | The research question |

Higher breadth = wider coverage. Higher depth = more follow-up drilling. Total searches ≈ `breadth × (1 + breadth/2 + breadth/4 + ...)`.

## Core Algorithm

```
deepResearch(query, breadth=4, depth=3, learnings=[]):
  1. Generate `breadth` SERP queries from query + accumulated learnings
  2. For each query (parallel, concurrency=3):
     a. Search via Exa deep + Serper (dual-source)
     b. Extract learnings + follow-up questions from results
     c. If depth > 1:
        nextQuery = research_goal + follow_up_questions
        deepResearch(nextQuery, breadth/2, depth-1, allLearnings)
     d. Else: return learnings + URLs
  3. Deduplicate learnings, return all
```

## Execution

### Step 0: Clarify (optional)

If the topic is vague, ask 1-2 sharpening questions:
- "What's your goal — learning, deciding, or writing?"
- "Any specific angle or time period?"

If user says "just do it" — proceed with defaults.

### Step 1: Plan Research Tree

Break the topic into **research sub-questions** (these become the initial breadth queries):

```
Topic: "State of nuclear fusion energy in 2026"
→ Sub-questions:
  1. What fusion approaches are closest to net energy gain?
  2. Which companies have the most funding and progress?
  3. What are the engineering bottlenecks?
  4. What's the regulatory landscape?
```

### Step 2: Execute the Recursive Search

For EACH sub-question at each depth level, run dual-source search:

#### Exa Deep Search (semantic, high-quality)

```bash
EXA_API_KEY=$(pass api/exa 2>/dev/null)
curl -s -X POST "https://api.exa.ai/search" \
  -H "x-api-key: $EXA_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "query": "<sub-question>",
    "type": "deep",
    "numResults": 5,
    "effort": "base",
    "contents": {
      "text": { "maxCharacters": 5000 },
      "highlights": true,
      "summary": true
    },
    "excludeDomains": ["wikipedia.org"],
    "startPublishedDate": "2025-01-01"
  }' | jq '{results: [.results[] | {title, url, summary, highlights, text}]}'
```

#### Serper Google SERP (factual, current)

```bash
SERPER_API_KEY="${SERPER_API_KEY:-$(pass api/serper2 2>/dev/null || pass api/serper 2>/dev/null)}"
curl -s -X POST "https://google.serper.dev/search" \
  -H "X-API-KEY: $SERPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q": "<sub-question>", "num": 8}' | \
  jq -r '.organic[] | {title, link, snippet}'
```

#### For academic topics, add Scholar

```bash
curl -s -X POST "https://google.serper.dev/scholar" \
  -H "X-API-KEY: $SERPER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"q": "<sub-question>", "num": 5}' | jq '.organic[]'
```

### Step 3: Extract Learnings

After each search batch, extract structured learnings. For each result set:

**What to extract:**
- Concrete facts with numbers, dates, names (not vague summaries)
- Entities: people, companies, products, institutions
- Exact metrics, statistics, dollar amounts
- Contrarian or surprising findings
- Contradictions between sources

**What to generate:**
- 3-5 **learnings** per search (dense, specific, entity-rich)
- 2-3 **follow-up questions** that go deeper based on what was found

### Step 4: Recurse Deeper

For each follow-up direction, construct the next query:

```
Next query = "Previous goal: <research_goal>
Follow-up directions:
- <follow_up_question_1>
- <follow_up_question_2>"
```

Recurse with `breadth = ceil(breadth/2)` and `depth = depth - 1`.

This naturally focuses: level 1 is broad (4 queries), level 2 is narrower (2 queries per branch), level 3 is laser-focused (1 query per branch).

### Step 5: Deep-Read Key Sources

After all recursion completes, pick the 3-5 most important URLs and extract full content:

```bash
# Exa content extraction
curl -s -X POST "https://api.exa.ai/contents" \
  -H "x-api-key: $EXA_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "urls": ["<url1>", "<url2>", "<url3>"],
    "text": { "maxCharacters": 10000 },
    "summary": true,
    "highlights": { "query": "<original_topic>" }
  }'
```

### Step 6: Synthesize Final Report

Combine ALL accumulated learnings into a comprehensive report:

```markdown
# <Topic>: Deep Research Report
*Generated: <date> · Sources: <N> · Depth: <D> levels · Confidence: High/Medium/Low*

## Executive Summary
3-5 sentences. The answer, not the methodology.

## 1. <Major Theme>
Findings with inline citations: "Company X raised $2B ([Source](url))"
- Key data points with attribution
- Cross-referenced claims

## 2. <Major Theme>
...

## 3. <Major Theme>
...

## 4. Contrarian Views & Uncertainties
What one source says that others don't. Flag speculation.

## Key Takeaways
- Actionable insight 1
- Actionable insight 2
- Actionable insight 3

## Research Gaps
What couldn't be found. What needs primary research.

## Sources
1. [Title](url) — one-line summary
2. ...

## Methodology
- Queries generated: N
- Sources analyzed: M
- Depth levels: D
- Search engines: Exa (semantic) + Serper (Google SERP)
```

## Parallelism with Subagents

For breadth ≥ 4, use **subagent parallelism** to research sub-questions concurrently. Each subagent handles one branch of the research tree:

```
Launch 3-4 subagents in parallel:
  Agent 1: Research sub-questions 1-2 (depth=2)
  Agent 2: Research sub-questions 3-4 (depth=2)
  Agent 3: Cross-cutting themes + contrarian views
Main session: Synthesize all findings into final report
```

Each subagent searches, reads, extracts learnings, and returns structured findings. The main session deduplicates and synthesizes.

## For Maximum Depth: Exa Research API

For very complex topics where you want Exa's own agent to do deep research:

```bash
# Fire async research task
curl -s -X POST "https://api.exa.ai/research" \
  -H "x-api-key: $EXA_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "instructions": "<detailed research question>",
    "model": "exa-research-pro",
    "outputSchema": {
      "type": "object",
      "properties": {
        "findings": { "type": "array", "items": { "type": "object", "properties": {
          "claim": { "type": "string" },
          "source": { "type": "string" },
          "confidence": { "type": "string" }
        }}},
        "summary": { "type": "string" },
        "gaps": { "type": "array", "items": { "type": "string" } }
      }
    }
  }'

# Poll for results
RESEARCH_ID="<from above>"
curl -s "https://api.exa.ai/research/$RESEARCH_ID" \
  -H "x-api-key: $EXA_API_KEY" | jq '{status, output}'
```

Use this as ONE input alongside your own iterative search — don't delegate everything to it.

## Quality Rules

1. **Every claim needs a source.** Unsourced → flagged or dropped.
2. **Cross-reference.** Single-source claims get `[unverified]` tag.
3. **Recency bias.** Prefer sources < 12 months old. Flag stale data.
4. **Entities over vibes.** "Revenue grew 40% to $2.1B" > "Revenue grew significantly."
5. **Contradictions are gold.** When sources disagree, present both sides.
6. **Separate fact from inference.** Label estimates, projections, opinions.
7. **No hallucination.** If data wasn't found, say "insufficient data" — never fabricate.
8. **Contrarian check.** Actively search for opposing views on key claims.

## Output

- Short topics (< 3 pages): post in chat
- Long reports: save to `.git/reports/<topic-slug>-YYYYMMDD.md`
- Always print `file:///absolute/path` for generated files

## Quick Reference: Effort Levels

| Preset | Breadth | Depth | ~Searches | ~Time | Use |
|--------|---------|-------|-----------|-------|-----|
| Quick | 3 | 1 | 3 | 1 min | Simple factual questions |
| Standard | 4 | 2 | 12 | 3-5 min | Most research tasks |
| Deep | 5 | 3 | 25 | 8-15 min | Comprehensive analysis |
| Exhaustive | 8 | 4 | 60+ | 20-30 min | Due diligence, competitive intel |

## Examples

```
"Deep research: state of nuclear fusion energy"
"Investigate Rust vs Go for high-frequency trading systems"
"Deep dive: best strategies for bootstrapping B2B SaaS in 2026"
"Thorough analysis of CRISPR gene therapy competitive landscape"
"Research the current state of AI code editors — who's winning and why"
```
