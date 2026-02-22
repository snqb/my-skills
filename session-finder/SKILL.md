---
name: session-finder
description: Smart search through Pi session history. Find past conversations by keywords, topics, date, or tools used. Resume or export sessions. Use when you need to find a previous session.
---

# Session Finder

Search Pi sessions stored in `~/.pi/agent/sessions/`.

## Session Location

```bash
# Default location
~/.pi/agent/sessions/

# Sessions organized by working directory
~/.pi/agent/sessions/--Users-sn-Projects-myproject--/
```

## Quick Search Patterns

### Single Keyword

```bash
rg -l "keyword" ~/.pi/agent/sessions/ --glob "*.jsonl"
```

### AND Search (A + B)

Find sessions containing BOTH terms:

```bash
rg -l "term1" ~/.pi/agent/sessions/**/*.jsonl | xargs rg -l "term2"
```

### OR Search (A | B)

```bash
rg -l "term1|term2" ~/.pi/agent/sessions/ --glob "*.jsonl"
```

### Phrase Search

```bash
rg -l "professional website" ~/.pi/agent/sessions/ --glob "*.jsonl"
```

## Smart Search with Context

### Show Matching User Messages

```bash
TERM="your search term"
for f in $(rg -l "$TERM" ~/.pi/agent/sessions/**/*.jsonl 2>/dev/null); do
  echo "📁 $f"
  rg '"role":"user"' "$f" | head -3 | sed 's/.*"text":"/  → /; s/".*/.../' | cut -c1-120
  echo ""
done
```

### Show Actual Match Context

```bash
TERM="professional"
for f in $(rg -l "$TERM" ~/.pi/agent/sessions/**/*.jsonl 2>/dev/null | head -10); do
  echo "🎯 $f"
  rg -o '"text":"[^"]{0,100}'"$TERM"'[^"]{0,100}"' "$f" | head -2
  echo ""
done
```

## Date Filtering

### Sessions by Date

```bash
# List sessions from today
find ~/.pi/agent/sessions -name "*.jsonl" -mtime 0

# Last 7 days
find ~/.pi/agent/sessions -name "*.jsonl" -mtime -7

# Specific date range (using filename)
ls ~/.pi/agent/sessions/**/*.jsonl | grep "2026-02-05"
```

### Recent Sessions (sorted)

```bash
# Most recent first
ls -lt ~/.pi/agent/sessions/**/*.jsonl 2>/dev/null | head -20
```

## Find by Tool/Skill Used

### Sessions Using Specific Skill

```bash
# Sessions that used HN research
rg -l "hn-research|hn.algolia" ~/.pi/agent/sessions/**/*.jsonl

# Sessions that used browser automation
rg -l "browser-tools|playwright|puppeteer" ~/.pi/agent/sessions/**/*.jsonl

# Sessions with code changes
rg -l '"name":"Edit"' ~/.pi/agent/sessions/**/*.jsonl
```

### Sessions with Specific Commands

```bash
# Sessions that ran git commands
rg -l "git commit|git push" ~/.pi/agent/sessions/**/*.jsonl

# Sessions with pip/npm installs
rg -l "pip install|npm install" ~/.pi/agent/sessions/**/*.jsonl
```

## Find by Project

```bash
# List all project session directories
ls ~/.pi/agent/sessions/

# Search within specific project
rg "keyword" ~/.pi/agent/sessions/--Users-sn-Projects-myproject--/ --glob "*.jsonl"
```

## Resume & Export

### Resume a Session

```bash
pi --session /path/to/session.jsonl
```

### Continue Most Recent

```bash
pi --continue  # or pi -c
```

### Select from List

```bash
pi --resume  # or pi -r
```

### Export to HTML

```bash
pi --export /path/to/session.jsonl output.html
pi --export /path/to/session.jsonl  # outputs to stdout
```

## Complete Workflow Example

### "Find that session where we discussed X and Y"

```bash
#!/bin/bash
# Find sessions matching multiple criteria

TERM1="professional"
TERM2="website"

echo "🔍 Searching for sessions with '$TERM1' AND '$TERM2'..."
echo ""

MATCHES=$(rg -l "$TERM1" ~/.pi/agent/sessions/**/*.jsonl 2>/dev/null | xargs rg -l "$TERM2" 2>/dev/null)

if [ -z "$MATCHES" ]; then
  echo "No matches found."
  exit 0
fi

for f in $MATCHES; do
  echo "📁 $(basename $(dirname $f))"
  echo "   $f"
  
  # Extract first user message for context
  FIRST_MSG=$(rg '"role":"user"' "$f" 2>/dev/null | head -1 | sed 's/.*"text":"//; s/".*//' | cut -c1-100)
  echo "   → $FIRST_MSG..."
  
  # Show matching snippet
  SNIPPET=$(rg -o "[^\"]{0,50}($TERM1|$TERM2)[^\"]{0,50}" "$f" 2>/dev/null | head -1)
  echo "   ✓ $SNIPPET"
  echo ""
done

echo "Resume with: pi --session <path>"
```

## JQ Helpers

### Extract User Messages Only

```bash
cat session.jsonl | jq -r 'select(.type == "message") | select(.message.role == "user") | .message.content[0].text' 2>/dev/null
```

### Get Session Summary

```bash
cat session.jsonl | jq -r '
  if .type == "session" then "📅 \(.timestamp) | \(.cwd)"
  elif .type == "message" and .message.role == "user" then "👤 \(.message.content[0].text[0:80])..."
  else empty end
' 2>/dev/null | head -10
```

### Count Messages

```bash
cat session.jsonl | jq -s '[.[] | select(.type == "message")] | length'
```

## Pro Tips

1. **Start broad, narrow down** - Begin with one keyword, add more to filter
2. **Check project folders** - Sessions are organized by working directory
3. **Use filename dates** - Filenames contain ISO timestamps
4. **Search user messages** - Filter on `"role":"user"` for your original questions
5. **Combine with grep** - `rg` is faster, but `grep -A5` shows context

## Common Searches

| What | Command |
|------|---------|
| Recent sessions | `ls -lt ~/.pi/agent/sessions/**/*.jsonl \| head -10` |
| Sessions with errors | `rg -l "error\|Error\|ERROR" ~/.pi/agent/sessions/**/*.jsonl` |
| Sessions with code edits | `rg -l '"name":"Edit"' ~/.pi/agent/sessions/**/*.jsonl` |
| Sessions about topic | `rg -l "topic" ~/.pi/agent/sessions/**/*.jsonl` |
| Today's sessions | `find ~/.pi/agent/sessions -name "*.jsonl" -mtime 0` |

## Troubleshooting

**No results?**
- Check spelling
- Try partial match (fewer characters)
- Use case-insensitive: `rg -li "term"`

**Too many results?**
- Add more search terms (AND search)
- Filter by date
- Filter by project directory

**Slow search?**
- Limit to specific project folder
- Use `--max-count 1` to stop after first match per file
