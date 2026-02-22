---
name: notebooklm
description: Full programmatic control of Google NotebookLM — create notebooks, add sources (URLs, PDFs, YouTube, text), query with Gemini, generate artifacts (podcasts, videos, quizzes, slides, mind maps), download everything. Parallelizable. Uses notebooklm-py (unofficial RPC API, no browser automation). Replaces old browser-based notebooklm skill.
---

# NotebookLM — Full Programmatic Access

Create notebooks, fill them with research, query Gemini, generate content — all from the command line. Powered by `notebooklm-py` (unofficial Python API using reverse-engineered Google RPC).

> **This replaces the old `notebooklm` skill** (browser automation via Patchright). This version is faster (direct RPC, no browser per query), supports full CRUD (create/delete notebooks, add sources), and is parallelizable.

## When to Use

- User wants to **create** a notebook programmatically
- User wants to **add sources** (URLs, PDFs, YouTube, Google Drive, raw text)
- User wants to **query** notebooks with Gemini (source-grounded answers)
- User wants to **generate** artifacts: podcasts, videos, quizzes, flashcards, slides, reports, mind maps, infographics, data tables
- User wants to **download** generated content (MP3, MP4, PDF, PNG, CSV, JSON, MD)
- User says "research X and put it in NotebookLM"
- User mentions notebooklm, notebooklm2, "query my notebook", "ask my docs"
- Any previous reference to the old notebooklm skill — use this one instead

## Setup (run.sh handles everything)

All commands go through `run.sh` which auto-creates venv and installs deps:

```bash
cd ~/.pi/agent/skills/notebooklm
bash run.sh status        # check auth + show active notebook
bash run.sh login         # browser opens for Google login (one-time)
```

## ⚠️ CRITICAL: Always use run.sh

```bash
# ✅ CORRECT
cd ~/.pi/agent/skills/notebooklm && bash run.sh <command> [args...]

# ❌ WRONG
notebooklm <command>      # might not exist in PATH
python -m notebooklm ...  # wrong venv
```

## Auth Migration

If already authenticated with the original `notebooklm` skill:
```bash
cd ~/.pi/agent/skills/notebooklm && bash run.sh migrate-auth
```
This copies cookies from the old skill's `state.json` to `~/.notebooklm/storage_state.json`.

## Core Workflows

### 1. Check Status
```bash
bash run.sh status
```

### 2. List Notebooks
```bash
bash run.sh list
```

### 3. Create Notebook + Add Sources
```bash
# Create
bash run.sh create "My Research Topic"

# Set as active
bash run.sh use <notebook_id>

# Add sources (auto-detects type)
bash run.sh source add "https://example.com/article"
bash run.sh source add "https://youtube.com/watch?v=..."
bash run.sh source add "./document.pdf"
bash run.sh source add-text "Title" "Raw text content here"

# Add with research (auto-discovers and imports relevant sources)
bash run.sh source add-research "topic query" --mode deep
```

### 4. Query / Chat
```bash
bash run.sh ask "What are the main themes?"
bash run.sh ask "Compare the approaches" --json    # with source refs
bash run.sh ask "Summarize" -s source_id1 -s source_id2  # specific sources only
```

### 5. Generate Artifacts
```bash
# Audio (podcast)
bash run.sh generate audio "Focus on practical applications" --wait
bash run.sh generate audio --format deep-dive --length long --wait
bash run.sh generate audio --format debate --wait

# Video
bash run.sh generate video --style whiteboard --wait
bash run.sh generate video --format brief --style kawaii --wait

# Text/Visual
bash run.sh generate report --format study-guide --wait
bash run.sh generate report --format blog-post --wait
bash run.sh generate quiz --difficulty hard --quantity more --wait
bash run.sh generate flashcards --wait
bash run.sh generate slide-deck --wait
bash run.sh generate infographic --orientation portrait --wait
bash run.sh generate mind-map
bash run.sh generate data-table "compare key concepts" --wait
```

### 6. Download Artifacts
```bash
bash run.sh download audio ./podcast.mp3
bash run.sh download video ./overview.mp4
bash run.sh download slide-deck ./slides.pdf
bash run.sh download report ./report.md
bash run.sh download quiz --format markdown ./quiz.md
bash run.sh download flashcards --format json ./cards.json
bash run.sh download infographic ./infographic.png
bash run.sh download mind-map ./mindmap.json
bash run.sh download data-table ./data.csv
bash run.sh download audio --all    # batch download all audio
```

### 7. Manage Sources
```bash
bash run.sh source list
bash run.sh source get <source_id>
bash run.sh source fulltext <source_id>         # get indexed text
bash run.sh source guide <source_id>            # AI summary + keywords
bash run.sh source rename <source_id> "Better Name"
bash run.sh source refresh <source_id>          # re-fetch URL content
bash run.sh source delete <source_id>
```

### 8. Share & Export
```bash
bash run.sh share                               # toggle public sharing
bash run.sh share --revoke
# Export artifacts to Google Docs/Sheets (via Python API)
```

### 9. Research Agents
```bash
bash run.sh source add-research "AI safety" --mode deep --import-all
bash run.sh source add-research "market trends" --from drive
bash run.sh research status
bash run.sh research wait --import-all
```

## Parallel Execution

All commands accept `-n <notebook_id>`, so multiple operations run concurrently on different notebooks with no shared state conflicts. Tested: parallel create, source add, ask, research — all work.

```bash
NB_A="<id_a>"
NB_B="<id_b>"
NB_C="<id_c>"

# Parallel research into 3 notebooks at once
(bash run.sh source add-research "topic A" -n $NB_A --mode fast --import-all &
 bash run.sh source add-research "topic B" -n $NB_B --mode fast --import-all &
 bash run.sh source add-research "topic C" -n $NB_C --mode fast --import-all &
 wait)

# Parallel queries
(bash run.sh ask "question" -n $NB_A --new 2>&1 > /tmp/a.txt &
 bash run.sh ask "question" -n $NB_B --new 2>&1 > /tmp/b.txt &
 bash run.sh ask "question" -n $NB_C --new 2>&1 > /tmp/c.txt &
 wait)
```

**Safe concurrency: 3-4 parallel.** Beyond that, Google rate limits may kick in. Each notebook is fully independent — no context.json conflicts when using `-n` explicitly.

## End-to-End Example: Research Pipeline

```bash
cd ~/.pi/agent/skills/notebooklm

# Create notebook
bash run.sh create "Kyrgyzstan Real Estate 2026"
bash run.sh use <id_from_output>

# Add sources
bash run.sh source add "https://stat.kg/en/statistics/stroitelstvo/"
bash run.sh source add "https://youtube.com/watch?v=relevant_video"
bash run.sh source add ~/reports/bishkek-market-analysis.pdf
bash run.sh source add-text "Field Notes" "Observations from site visits..."

# Deep research (auto-discovers and imports more sources)
bash run.sh source add-research "Bishkek real estate market 2026" --mode deep --import-all

# Query
bash run.sh ask "What are the price trends by district?"
bash run.sh ask "Compare residential vs commercial growth"

# Generate outputs
bash run.sh generate audio "Focus on investment opportunities" --format deep-dive --wait
bash run.sh generate report --format briefing-doc --wait
bash run.sh generate quiz --difficulty medium --wait

# Download
bash run.sh download audio ./kg-realestate-podcast.mp3
bash run.sh download report ./kg-realestate-briefing.md
bash run.sh download quiz --format markdown ./kg-realestate-quiz.md
```

## Python API (for custom scripts)

```python
import asyncio
from notebooklm import NotebookLMClient

async def main():
    async with await NotebookLMClient.from_storage() as client:
        nb = await client.notebooks.create("Research")
        await client.sources.add_url(nb.id, "https://example.com")
        result = await client.chat.ask(nb.id, "Summarize")
        print(result.answer)

        status = await client.artifacts.generate_audio(nb.id, instructions="make it fun")
        await client.artifacts.wait_for_completion(nb.id, status.task_id)
        await client.artifacts.download_audio(nb.id, "podcast.mp3")

asyncio.run(main())
```

Run custom scripts: `cd ~/.pi/agent/skills/notebooklm && source .venv/bin/activate && python my_script.py`

## Audio Formats & Styles

| Audio Format | Description |
|---|---|
| `deep-dive` | Two hosts explore topics in depth (default) |
| `brief` | Quick summary overview |
| `critique` | Critical analysis and debate |
| `debate` | Opposing viewpoints |

| Audio Length | Description |
|---|---|
| `short` | ~5 min |
| `default` | ~10-15 min |
| `long` | ~20-30 min |

| Video Style | Description |
|---|---|
| `auto` | AI selects best style |
| `classic` | Standard presentation |
| `whiteboard` | Hand-drawn style |
| `kawaii` | Cute Japanese style |
| `anime` | Anime-inspired |
| `watercolor` | Artistic watercolor |
| `retro-print` | Vintage print |
| `heritage` | Classic heritage |
| `paper-craft` | Paper craft style |

## Pattern: Sourced Q&A Pipeline (ask --json)

Use `--json` to get **citation → source mapping** for source-grounded content:

```bash
# Ask with JSON output — returns answer + references[{citation_number, source_id, cited_text}]
bash run.sh ask "When was X born? 1-2 sentences. Cite [N]." --json --new

# Map source_id → URL
bash run.sh source list --json
```

**Key rules:**
- **Keep questions short** ("2-3 sentences") — long answers timeout on `--json`
- **Use `--new`** for each question (fresh conversation, no context bleed)
- **Retry 2-3x** on timeout — Google API is flaky, same question often works on retry
- **Rich notebooks win** — 30+ sources give 8/8 answers; auto-research gives 5-10 sources and 4/8

**Timeout fix** (patch `_core.py` after each upgrade):
```bash
# In .venv/.../notebooklm/_core.py, line ~35:
# Change: DEFAULT_TIMEOUT = 30.0
# To:     DEFAULT_TIMEOUT = float(os.environ.get("NOTEBOOKLM_TIMEOUT", "120"))
# Also add: import os
```

Then: `NOTEBOOKLM_TIMEOUT=120 bash run.sh ask "..." --json --new`

**Example pipeline (biography research):**
```bash
# 1. Create/use notebook with sources about the person
bash run.sh use <notebook_id>

# 2. Ask focused questions
bash run.sh ask "Where was X born? Family? 2-3 sentences. Cite [N]." --json --new > q1.json
bash run.sh ask "What did X create? 2-3 sentences. Cite [N]." --json --new > q2.json
bash run.sh ask "Who were X's friends and enemies? Names. Cite [N]." --json --new > q3.json

# 3. Get source map
bash run.sh source list --json > sources.json

# 4. Chain: answer → citation_number → source_id → URL
# Each reference in --json output has: source_id, citation_number, cited_text
# sources.json maps source_id → {title, url}
```

**cited_text quality:** Unreliable for display (truncated, wrong language, generic chunks). Write human descriptions instead ("Архивные документы: арест, допросы, приговор").

See: `~/research/bishkek-streets/prompts/qa-bio-pipeline.md` for full documented pipeline.

## Limitations

- **Unofficial API** — uses undocumented Google RPC endpoints, can break without notice
- **Rate limits** — free tier has daily limits, heavy usage may be throttled
- **Auth cookies expire** — re-run `bash run.sh login` when auth fails
- **Best for** prototypes, research, personal projects

## Troubleshooting

| Problem | Solution |
|---|---|
| Auth expired | `bash run.sh login` |
| Rate limited | Wait, or reduce request frequency |
| RPC error | Google may have changed endpoints; check for `notebooklm-py` updates: `bash run.sh upgrade` |
| Missing venv | Delete `.venv/`, run any command (auto-recreates) |
| Can't find notebooklm CLI | Always use `bash run.sh` wrapper |

## Data Storage

```
~/.notebooklm/                    # notebooklm-py home
├── storage_state.json            # Auth cookies
├── context.json                  # Active notebook/conversation
└── browser_profile/              # Chromium profile (for login)

~/.pi/agent/skills/notebooklm/   # Skill directory
├── SKILL.md                      # This file
├── run.sh                        # Wrapper script
└── .venv/                        # Python virtual environment
```
