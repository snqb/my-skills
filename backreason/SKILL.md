---
name: backreason
description: Mine pi session history to discover what the user actually cares about. Use empirical evidence (session starters, concept frequency) to improve AGENTS.md, navigation maps, skill gaps, or any documentation. "What do I keep asking about?" → make it findable.
---

# Backreason

Reason backwards from usage patterns to improve project orientation.

**Core idea:** Don't guess what belongs in AGENTS.md or docs — measure it. Mine past sessions, extract the user's actual vocabulary, compare against what's documented, fix the gaps.

## When to Use

- Reconciling AGENTS.md (pair with `agents-md` skill)
- User asks "what do I keep working on?" or "what's missing?"
- After 20+ sessions in a project — enough signal to analyze
- When AGENTS.md feels stale or bloated — evidence-based trim

## Workflow

### 1. Find Sessions

```bash
SESSION_DIR=~/.pi/agent/sessions/--$(pwd | tr '/' '-' | sed 's/^-//')--
ls "$SESSION_DIR"/*.jsonl 2>/dev/null | wc -l
```

If no sessions found, try fuzzy match:
```bash
ls ~/.pi/agent/sessions/ | grep -i "$(basename $(pwd))"
```

### 2. Extract Starter Messages

The first user message per session reveals intent — what they came to do.

```bash
for f in $(ls -t "$SESSION_DIR"/*.jsonl 2>/dev/null); do
  date=$(basename "$f" | cut -c1-10)
  msg=$(cat "$f" | jq -r 'select(.type == "message") | select(.message.role == "user") | .message.content[0].text' 2>/dev/null | head -1 | cut -c1-120)
  [ -n "$msg" ] && echo "$date | $msg"
done
```

### 3. Concept Frequency

Build a grep pattern from project-specific terms. Start broad, then cluster.

```bash
# Save starters to temp file first (step 2 output)
cat /tmp/starters.txt | tr '[:upper:]' '[:lower:]' | \
  grep -oE '(term1|term2|term3|...)' | \
  sort | uniq -c | sort -rn | head -30
```

**How to build the term list:**
- Scan the starters manually first — note recurring nouns
- Add directory names, file names, feature names from the project
- Include the user's informal names (they say "freshness", code says "staleness")
- Include operational terms (prod, deploy, logs, dashboard)

### 4. Cluster & Rank

Group related terms into concept clusters. Rank by total mentions.

```
 #  Cluster              Mentions  User's words
 1  parser/scraping      20        parser, scraping, scraped
 2  bot                  12        bot
 3  photos/collages      10        photos, collage
 ...
```

### 5. Coverage Check

Compare top concepts against AGENTS.md (or whatever doc you're improving):

```bash
grep -oiE '(term1|term2|...)' AGENTS.md | tr '[:upper:]' '[:lower:]' | sort -u
```

Build a gap table:

| Concept | Mentions | In docs? | Where it lives |
|---------|----------|----------|----------------|
| collage | 10 | ❌ | `bot/dialogs/ad_browser/getters.py` |
| zones | 5 | ❌ | `bot/shared/districts/kg_zones.py` |

### 6. Fix Gaps

For each missing concept, find where it lives in code:
```bash
grep -rl "concept" src/ --include="*.py" | head -5
```

Then update the doc using the **user's vocabulary**, not the code's internal naming:
- Code says `staleness.py` → Map says "Freshness checks — verify active listings still exist"
- Code says `getters.py` → Map says "photo albums, collages"

## Key Principles

**Use their words.** If the user says "freshness" 4 times and never "staleness", the Map should say "freshness". Alias the code term parenthetically.

**Starters reveal priority.** The first message is what they came to do. Later messages are follow-ups. Weight starters heavily.

**Frequency = importance.** If they ask about photos/collages 10 times, it's a core concept — not a detail to bury.

**Absence = problem.** If a concept appears 5+ times in sessions but 0 times in AGENTS.md, that's a navigation failure. Every session where they had to ask "where is X?" was wasted time.

**Operational > architectural.** Users ask "why isn't prod scraping?" more than "explain the extraction pipeline". Firefighting paths matter.

## Output

This skill doesn't produce a standalone artifact — it feeds into other skills:

- **`agents-md`** — evidence-based Map entries and gotchas
- **Any project doc** — vocabulary alignment, coverage gaps
- **Skill creation** — if a concept cluster is big enough, maybe it needs its own skill

## Example Session

```
User: "can you see my past sessions and figure out what concepts I use a lot?"

1. Found 61 sessions in parser-staging
2. Extracted 61 starter messages
3. Built concept frequency (20 clusters)
4. Compared against AGENTS.md Map (16 entries)
5. Found 6 gaps: collage, zones, house_kg, admin, photos, freshness
6. Updated Map with user's vocabulary
7. Result: 73-line AGENTS.md that covers all top-20 concepts
```
