---
name: exa-notebooklm
description: "Source-grounded research pipeline: Exa web search → NotebookLM RAG → structured data. Finds real sources (no Wikipedia), feeds them into a private knowledge base, queries for cited facts. Zero hallucination content generation."
---

# Exa + NotebookLM Research Pipeline

Combine Exa (semantic web search) with NotebookLM (source-grounded RAG) to produce deeply researched, fully cited content — without LLM hallucination.

**Requires:** `exa-search` skill + `notebooklm` skill installed and authenticated.

## Why This Combo

- **Exa alone**: finds great sources, but you still need to read and synthesize them yourself
- **Exa Research alone**: produces structured reports, but you can't interrogate the sources further or generate podcasts/quizzes
- **NotebookLM alone**: powerful RAG, but limited to sources you manually add
- **Together**: Exa discovers sources → NB ingests and indexes them → you query NB for cited answers, generate podcasts, quizzes, etc.

## The Pipeline

```
1. EXA SEARCH        → find real sources (academic, journalism, primary)
2. FEED INTO NB      → create notebook, add best URLs as sources
3. QUERY NB          → ask synthesis questions, get cited answers
4. CURATE OUTPUT     → extract facts, quotes, numbers into structured data
```

## Step 1: Exa Search — Find Sources

Two approaches depending on scope:

### A) Batch search (many targeted queries)

Best for breadth. Exclude Wikipedia — the point is sources Wikipedia doesn't have.

```bash
export EXA_API_KEY=$(pass api/exa 2>/dev/null)

QUERIES=(
  "topic primary sources"
  "topic academic paper"
  "topic documentary evidence"
  "topic statistics data 2024"
)

for q in "${QUERIES[@]}"; do
  curl -s -X POST "https://api.exa.ai/search" \
    -H "x-api-key: $EXA_API_KEY" \
    -H "content-type: application/json" \
    -d "{
      \"query\": \"$q\",
      \"numResults\": 8,
      \"excludeDomains\": [\"wikipedia.org\"],
      \"contents\": { \"text\": { \"maxCharacters\": 2000 } }
    }" | jq -c '.results[]' >> /tmp/exa-batch.jsonl
  sleep 0.5
done

jq -s 'unique_by(.url)' /tmp/exa-batch.jsonl > /tmp/exa-deduped.json
echo "Unique: $(jq length /tmp/exa-deduped.json)"
```

### B) Deep search (single comprehensive query)

Best for depth on a specific question. Exa runs multi-query expansion internally.

```bash
curl -s -X POST "https://api.exa.ai/search" \
  -H "x-api-key: $EXA_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "query": "your research question here",
    "type": "deep",
    "effort": "max",
    "numResults": 20,
    "excludeDomains": ["wikipedia.org"],
    "contents": { "text": { "maxCharacters": 3000 } }
  }' | jq '.results[] | {title, url}' > /tmp/exa-deep.json
```

### C) Exa Research (async agent-style)

For the heaviest research. Exa plans, searches, reads, and produces a structured report.

```bash
# Create async research task
curl -s -X POST "https://api.exa.ai/research" \
  -H "x-api-key: $EXA_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "instructions": "Find all primary sources about TOPIC. Focus on academic papers, government data, and journalist accounts.",
    "model": "exa-research"
  }' | jq '{id: .researchId, status: .status}'

# Poll for results
curl -s "https://api.exa.ai/research/RESEARCH_ID" \
  -H "x-api-key: $EXA_API_KEY" | jq '{status, output}'
```

### Best source types to target

| Domain type | Examples | Why |
|---|---|---|
| Academic | academia.edu, jstor.org, researchgate.net | Primary research |
| UNESCO/IGO | unesco.org, worldbank.org | Authoritative data |
| Long-form journalism | theguardian.com, rferl.org | Detailed reporting |
| Specialist sites | craft blogs, industry journals | Niche expertise |
| Government | .gov, national statistics | Official data |

## Step 2: Feed Into NotebookLM

Create a notebook and add the best URLs as sources.

```bash
cd ~/.pi/agent/skills/notebooklm

# Create notebook
bash run.sh create "Research: Your Topic"
bash run.sh use <notebook_id>

# Add URLs from Exa results (pick the best ones)
bash run.sh source add "https://example.com/great-article"
bash run.sh source add "https://example.com/another-source"

# Add raw text for sources that don't have clean URLs
bash run.sh source add-text "Field Notes" "Your observations or quotes..."

# Check what's loaded
bash run.sh source list
```

### Feeding tips

- **Max ~50 sources per notebook.** Create multiple notebooks for large projects.
- **Quality > quantity.** 30 good sources beat 50 mediocre ones.
- **Wait for indexing.** Check `source list` — sources need "ready" status before querying.
- **Use `add-research` for auto-discovery:** NB can find additional sources on its own:
  ```bash
  bash run.sh source add-research "your topic" --mode deep --import-all
  ```

## Step 3: Query NotebookLM

Ask synthesis questions. NB answers ONLY from ingested sources, with citations.

```bash
cd ~/.pi/agent/skills/notebooklm

# Simple query
bash run.sh ask "What are the key findings about X?"

# JSON output with citation mapping (for programmatic use)
bash run.sh ask "List all dates and events mentioned. Cite [N]." --json --new

# Fresh conversation per question (prevents context bleed)
bash run.sh ask "Who are the main people involved?" --json --new
bash run.sh ask "What statistics are cited?" --json --new
```

### Query strategy

**Lists > summaries.** Ask for specific extractable data:

```
✅ "List all dates, names, and numbers mentioned about X. Cite [N]."
✅ "What direct quotes appear in the sources about Y?"
✅ "Create a bibliography of all sources that discuss Z."
✅ "Compare source A vs source B on topic W. 2-3 sentences. Cite [N]."

❌ "Summarize everything" (too vague, wastes the grounding)
❌ "What do you think about X?" (NB isn't meant for opinions)
```

**Keep answers short** when using `--json` — long answers timeout:
```
✅ "When was X founded? 1-2 sentences. Cite [N]."
❌ "Tell me everything about X's history in detail."
```

**Use `--new` for each question** to prevent context bleed between queries.

### Parallel queries across notebooks

```bash
NB_A="<id_a>"
NB_B="<id_b>"

(bash run.sh ask "question" -n $NB_A --new > /tmp/a.txt &
 bash run.sh ask "question" -n $NB_B --new > /tmp/b.txt &
 wait)
```

## Step 4: Curate Output

Take NB answers and structure them. The citation chain:

```
NB answer → citation [N] → source_id → URL (from source list)
```

```bash
# Get source mapping
bash run.sh source list --json > /tmp/sources.json

# Now you can trace: answer text → [1] → source_id → original URL
```

Write your final output with inline citations pointing to real URLs. This is what makes the content trustworthy — every claim traces back to a specific source.

## Full Example: Research a Topic End-to-End

```bash
# === 1. EXA: Find sources ===
export EXA_API_KEY=$(pass api/exa 2>/dev/null)

for q in \
  "Central Asian textile traditions academic" \
  "felt carpet making techniques UNESCO" \
  "nomadic craft documentation"; do
  curl -s -X POST "https://api.exa.ai/search" \
    -H "accept: application/json" \
    -H "content-type: application/json" \
    -H "x-api-key: $EXA_API_KEY" \
    -d "{
      \"query\": \"$q\",
      \"useAutoprompt\": true,
      \"numResults\": 8,
      \"excludeDomains\": [\"wikipedia.org\"],
      \"contents\": { \"text\": { \"maxCharacters\": 2000 } }
    }" | jq -c '.results[]' >> /tmp/research.jsonl
  sleep 0.5
done

echo "Found $(wc -l < /tmp/research.jsonl) results"

# === 2. FEED: Best URLs into NotebookLM ===
cd ~/.pi/agent/skills/notebooklm
bash run.sh create "Textile Traditions Research"
bash run.sh use <id>

# Add top URLs (review /tmp/research.jsonl, pick best)
jq -r '.url' /tmp/research.jsonl | sort -u | head -40 | while read url; do
  bash run.sh source add "$url"
  sleep 1
done

# === 3. QUERY: Extract structured data ===
bash run.sh ask "List all textile techniques mentioned with regions. Cite [N]." --json --new > /tmp/q1.json
bash run.sh ask "What specific materials and tools are described? Cite [N]." --json --new > /tmp/q2.json
bash run.sh ask "Timeline: when were these crafts first documented? Cite [N]." --json --new > /tmp/q3.json

# === 4. Also generate a podcast for fun ===
bash run.sh generate audio "Focus on the craft techniques" --format deep-dive --wait
bash run.sh download audio ./textiles-podcast.mp3
```

## Troubleshooting

| Problem | Fix |
|---|---|
| Exa returns 0 results | Check API key, check credits at exa.ai dashboard |
| NB source stuck on "processing" | Wait 1-2 min, or `source refresh <id>` |
| NB query times out | Use `NOTEBOOKLM_TIMEOUT=120`, keep answer short |
| NB auth expired | `bash run.sh login` |
| Too many sources | Split across multiple notebooks |

## Cost & Limits

- **Exa**: ~$0.003/query with content. 1000 queries ≈ $3. Check credits at dashboard.
- **NotebookLM**: Free tier. Daily limits on queries and artifact generation. Heavy use may throttle.
- **Sweet spot**: 50-100 Exa queries → 30-50 NB sources → 10-20 NB queries per research project.
