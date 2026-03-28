---
name: research
description: Deep multi-source research by orchestrating exa-search (semantic), serper-search (Google SERP), github-quality-search (Code), and hn-research (Trends/Sentiment). Use for comprehensive answers requiring synthesis from web, open source, and community.
---

# Research Specialist
A meta-skill for conducting deep, multi-source research by orchestrating `exa-search` (semantic Web), `serper-search` (Google SERP), `github-quality-search` (Code/Libraries), and `hn-research` (Trends/Sentiment). Use this when the user needs a comprehensive answer that requires synthesizing information from the web, open source ecosystem, and community discussions.

## Tools & Capabilities

### 1a. Web Research — Semantic (Exa)
*   **Source**: `exa-search`
*   **Use for**: Conceptual/semantic queries, finding related content, AI-native search with content extraction.
*   **Action**: Use `exa-search` for semantic search and when you need page contents inline.
*   **Fallback**: If Exa credits are exhausted, fall back to `serper-search`.

### 1b. Web Research — Google SERP (Serper)
*   **Source**: `serper-search`
*   **Use for**: Factual lookups, current events, pricing pages, official docs, news, local/places, shopping. Cheap and fast.
*   **Action**: Use `serper-search` for keyword-driven Google results, news, and when Exa is unavailable.
*   **Endpoints**: `/search`, `/news`, `/images`, `/scholar`, `/places`, `/shopping`

### 2. Ecosystem Research (GitHub)
*   **Source**: `github-quality-search`
*   **Use for**: Finding libraries, tools, frameworks, and checking the health/activity of solutions.
*   **Action**: Use `github-quality-search` to find the best tools for the job.

### 3. Community Research (Hacker News)
*   **Source**: `hn-research`
*   **Use for**: Gauging sentiment, finding hidden gems, understanding historical context, and "real world" usage reports.
*   **Action**: Use `hn-research` to see what real engineers think.

## Workflow

1.  **Analyze Request**: Determine which vectors (Web, Code, Community) are relevant.
2.  **Parallel Execution**:
    *   If looking for a solution: Check GitHub for tools + Serper/Exa for reviews.
    *   If exploring a topic: Check Serper for facts + Exa for deep content + HN for opinions.
    *   If debugging: Check Serper for fixes + GitHub issues.
    *   If Exa credits exhausted: Use Serper as primary web source.
3.  **Synthesis**: Combine findings into a structured report.
    *   *Summary*: High-level answer.
    *   *Deep Dive*: Evidence from Exa/Serper.
    *   *Tools*: Recommendations from GitHub.
    *   *Community Consensus*: Vibe check from HN.

## Guidelines
*   **Cross-Reference**: Don't rely on one source. If a library looks good on GitHub, check HN to see if people hate it in production.
*   **Citations**: Always attribute where the info came from (e.g., "According to the docs...", "HN users discuss...", "The repo has 5k stars...").
*   **Synthesize, Don't Dump**: Do not just list search results. Read them and write a coherent answer.
