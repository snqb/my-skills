---
name: notebooklm
description: "Programmatic control of Google NotebookLM — create notebooks, add sources (URLs, PDFs, YouTube, text), query with Gemini, generate artifacts (podcasts, videos, quizzes, slides, mind maps), download everything. Uses notebooklm-py (unofficial RPC API)."
---

# NotebookLM — Programmatic Access

Create notebooks, add sources, query Gemini, generate content — all from CLI. Powered by `notebooklm-py` (unofficial Python API via reverse-engineered Google RPC).

## When to Use

- **Create** notebooks programmatically
- **Add sources**: URLs, PDFs, YouTube, Google Drive, raw text
- **Query** notebooks with Gemini (source-grounded answers, zero hallucination)
- **Generate** artifacts: podcasts, videos, quizzes, flashcards, slides, reports, mind maps, infographics, data tables
- **Download** generated content (MP3, MP4, PDF, PNG, CSV, JSON, MD)

## Setup

All commands go through `run.sh` which manages the uv environment and deps:

```bash
cd ~/.pi/agent/skills/notebooklm
bash run.sh status        # check auth + show active notebook
bash run.sh login         # browser opens for Google login (one-time)
```

### ⚠️ Always use run.sh

```bash
# ✅ CORRECT
cd ~/.pi/agent/skills/notebooklm && bash run.sh <command> [args...]

# ❌ WRONG — might use wrong env or not exist in PATH
notebooklm <command>
python -m notebooklm ...
```

## Core Workflows

### Check Status / List
```bash
bash run.sh status
bash run.sh list
```

### Create Notebook + Add Sources
```bash
bash run.sh create "My Research Topic"
bash run.sh use <notebook_id>

# Add sources (auto-detects type)
bash run.sh source add "https://example.com/article"
bash run.sh source add "https://youtube.com/watch?v=..."
bash run.sh source add "./document.pdf"
bash run.sh source add-text "Title" "Raw text content here"

# Auto-discover and import sources on a topic
bash run.sh source add-research "topic query" --mode deep
```

### Query / Chat
```bash
bash run.sh ask "What are the main themes?"
bash run.sh ask "Compare the approaches" --json    # with source refs
bash run.sh ask "Summarize" -s source_id1 -s source_id2  # specific sources only
```

### Generate Artifacts
```bash
# Audio (podcast)
bash run.sh generate audio "Focus on practical applications" --wait
bash run.sh generate audio --format deep-dive --length long --wait
bash run.sh generate audio --format debate --wait

# Video
bash run.sh generate video --style whiteboard --wait

# Text/Visual
bash run.sh generate report --format study-guide --wait
bash run.sh generate quiz --difficulty hard --quantity more --wait
bash run.sh generate flashcards --wait
bash run.sh generate slide-deck --wait
bash run.sh generate infographic --orientation portrait --wait
bash run.sh generate mind-map
bash run.sh generate data-table "compare key concepts" --wait
```

### Download Artifacts
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
bash run.sh download audio --all    # batch
```

### Manage Sources
```bash
bash run.sh source list
bash run.sh source get <source_id>
bash run.sh source fulltext <source_id>         # indexed text
bash run.sh source guide <source_id>            # AI summary + keywords
bash run.sh source rename <source_id> "Better Name"
bash run.sh source refresh <source_id>          # re-fetch URL
bash run.sh source delete <source_id>
```

### Share & Export
```bash
bash run.sh share                               # toggle public sharing
bash run.sh share --revoke
```

### Research Agents
```bash
bash run.sh source add-research "AI safety" --mode deep --import-all
bash run.sh source add-research "market trends" --from drive
bash run.sh research status
bash run.sh research wait --import-all
```

## Multi-Account Management

```bash
bash run.sh account list              # show all accounts
bash run.sh account add <name>        # login + save as named account
bash run.sh account use <name>        # switch to account
bash run.sh account rm <name>         # remove account
```

## Parallel Execution

All commands accept `-n <notebook_id>`, enabling concurrent operations on different notebooks.

```bash
NB_A="<id_a>"
NB_B="<id_b>"

# Parallel research
(bash run.sh source add-research "topic A" -n $NB_A --mode fast --import-all &
 bash run.sh source add-research "topic B" -n $NB_B --mode fast --import-all &
 wait)

# Parallel queries
(bash run.sh ask "question" -n $NB_A --new > /tmp/a.txt &
 bash run.sh ask "question" -n $NB_B --new > /tmp/b.txt &
 wait)
```

**Safe concurrency: 3-4 parallel.** Beyond that, Google rate limits kick in.

## Sourced Q&A Pipeline (ask --json)

Use `--json` for **citation → source mapping** in programmatic pipelines:

```bash
# Returns answer + references[{citation_number, source_id, cited_text}]
bash run.sh ask "When was X founded? 1-2 sentences. Cite [N]." --json --new

# Map source_id → URL
bash run.sh source list --json
```

**Rules:**
- **Keep answers short** ("2-3 sentences") — long answers timeout on `--json`
- **Use `--new`** per question — prevents context bleed
- **Retry 2-3x** on timeout — Google API is flaky
- **30+ sources** give best results; auto-research alone gives 5-10

**Timeout fix** (patch after each upgrade):
```bash
# In .venv/.../notebooklm/_core.py, line ~35:
# Change: DEFAULT_TIMEOUT = 30.0
# To:     DEFAULT_TIMEOUT = float(os.environ.get("NOTEBOOKLM_TIMEOUT", "120"))
# Also add: import os
```

Then: `NOTEBOOKLM_TIMEOUT=120 bash run.sh ask "..." --json --new`

**Citation chain:** answer → `[N]` → `source_id` → URL (from `source list --json`)

## Audio Formats & Styles

| Audio Format | Description |
|---|---|
| `deep-dive` | Two hosts explore in depth (default) |
| `brief` | Quick summary |
| `critique` | Critical analysis |
| `debate` | Opposing viewpoints |

| Length | Duration |
|---|---|
| `short` | ~5 min |
| `default` | ~10-15 min |
| `long` | ~20-30 min |

| Video Style | Description |
|---|---|
| `auto` | AI picks | `classic` | Standard |
| `whiteboard` | Hand-drawn | `kawaii` | Cute Japanese |
| `anime` | Anime | `watercolor` | Artistic |
| `retro-print` | Vintage | `heritage` | Classic heritage |
| `paper-craft` | Paper craft |

## Python API

```python
import asyncio
from notebooklm import NotebookLMClient

async def main():
    async with await NotebookLMClient.from_storage() as client:
        nb = await client.notebooks.create("Research")
        await client.sources.add_url(nb.id, "https://example.com")
        result = await client.chat.ask(nb.id, "Summarize")
        print(result.answer)

asyncio.run(main())
```

Run scripts: `cd ~/.pi/agent/skills/notebooklm && source .venv/bin/activate && python my_script.py`

## Limitations

- **Unofficial API** — uses reverse-engineered Google RPC, can break
- **Rate limits** — free tier has daily limits
- **Auth cookies expire** — re-run `bash run.sh login`
- **~50 sources per notebook** — create multiple notebooks for larger projects

## Troubleshooting

| Problem | Solution |
|---|---|
| Auth expired | `bash run.sh login` |
| Rate limited | Wait, reduce frequency |
| RPC error | `bash run.sh upgrade` |
| Missing venv | Delete `.venv/`, run any command |

## Data Storage

```
~/.notebooklm/
├── storage_state.json     # Auth cookies
├── context.json           # Active notebook/conversation
├── browser_profile/       # Chromium profile (for login)
└── accounts/              # Multi-account storage
    ├── personal.json
    └── work.json
```
