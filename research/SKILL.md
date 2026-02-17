---
description: Deep multi-source research by orchestrating exa-search (Web), github-quality-search (Code), and hn-research (Trends/Sentiment). Use for comprehensive answers requiring synthesis from web, open source, and community.
---

# Research Specialist
A meta-skill for conducting deep, multi-source research by orchestrating `exa-search` (Web), `github-quality-search` (Code/Libraries), and `hn-research` (Trends/Sentiment). Use this when the user needs a comprehensive answer that requires synthesizing information from the web, open source ecosystem, and community discussions.

## Tools & Capabilities

### 1. Web Research (Exa)
*   **Source**: `exa-search`
*   **Use for**: Technical documentation, blogs, official sites, comparative analysis, and solving general queries.
*   **Action**: Use `exa-search` to gather factual ground truth.

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
    *   If looking for a solution: Check GitHub for tools + Exa for reviews.
    *   If exploring a topic: Check Exa for facts + HN for opinions.
    *   If debugging: Check Exa for fixes + GitHub issues.
3.  **Synthesis**: Combine findings into a structured report.
    *   *Summary*: High-level answer.
    *   *Deep Dive*: Evidence from Exa.
    *   *Tools*: Recommendations from GitHub.
    *   *Community Consensus*: Vibe check from HN.

## Guidelines
*   **Cross-Reference**: Don't rely on one source. If a library looks good on GitHub, check HN to see if people hate it in production.
*   **Citations**: Always attribute where the info came from (e.g., "According to the docs...", "HN users discuss...", "The repo has 5k stars...").
*   **Synthesize, Don't Dump**: Do not just list search results. Read them and write a coherent answer.
