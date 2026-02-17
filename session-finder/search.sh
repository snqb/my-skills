#!/bin/bash
# session-finder: Smart session search
# Usage: ./search.sh "term1" ["term2"] [--recent N] [--project NAME]

set -e

SESSIONS_DIR="${PI_CODING_AGENT_DIR:-$HOME/.pi/agent}/sessions"

usage() {
  echo "Usage: $0 <term1> [term2] [options]"
  echo ""
  echo "Options:"
  echo "  --recent N      Only last N days"
  echo "  --project NAME  Filter by project (partial match)"
  echo "  --list          Just list paths, no context"
  echo "  --export PATH   Export first match to HTML"
  echo ""
  echo "Examples:"
  echo "  $0 'professional website'"
  echo "  $0 'hn' 'research' --recent 7"
  echo "  $0 'bug fix' --project myproject"
  exit 1
}

# Parse args
TERM1=""
TERM2=""
RECENT=""
PROJECT=""
LIST_ONLY=false
EXPORT_PATH=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --recent)
      RECENT="$2"
      shift 2
      ;;
    --project)
      PROJECT="$2"
      shift 2
      ;;
    --list)
      LIST_ONLY=true
      shift
      ;;
    --export)
      EXPORT_PATH="$2"
      shift 2
      ;;
    --help|-h)
      usage
      ;;
    *)
      if [ -z "$TERM1" ]; then
        TERM1="$1"
      elif [ -z "$TERM2" ]; then
        TERM2="$1"
      fi
      shift
      ;;
  esac
done

[ -z "$TERM1" ] && usage

# Build find command for date filtering
FIND_ARGS=(-name "*.jsonl")
[ -n "$RECENT" ] && FIND_ARGS+=(-mtime "-$RECENT")

# Find session files
if [ -n "$PROJECT" ]; then
  FILES=$(find "$SESSIONS_DIR" -path "*$PROJECT*" "${FIND_ARGS[@]}" 2>/dev/null)
else
  FILES=$(find "$SESSIONS_DIR" "${FIND_ARGS[@]}" 2>/dev/null)
fi

# Filter by terms
MATCHES=""
for f in $FILES; do
  if rg -q "$TERM1" "$f" 2>/dev/null; then
    if [ -z "$TERM2" ] || rg -q "$TERM2" "$f" 2>/dev/null; then
      MATCHES="$MATCHES $f"
    fi
  fi
done

if [ -z "$MATCHES" ]; then
  echo "No sessions found matching '$TERM1'${TERM2:+ AND '$TERM2'}"
  exit 0
fi

# Export mode
if [ -n "$EXPORT_PATH" ]; then
  FIRST=$(echo $MATCHES | awk '{print $1}')
  echo "Exporting: $FIRST"
  pi --export "$FIRST" "$EXPORT_PATH"
  exit 0
fi

# List mode
if $LIST_ONLY; then
  echo $MATCHES | tr ' ' '\n' | grep -v '^$'
  exit 0
fi

# Display with context
echo "🔍 Found $(echo $MATCHES | wc -w | tr -d ' ') session(s) matching '$TERM1'${TERM2:+ AND '$TERM2'}"
echo ""

for f in $MATCHES; do
  # Extract project from path
  PROJECT_NAME=$(basename $(dirname "$f") | sed 's/--Users-sn-//' | sed 's/--/\//g')
  
  # Get timestamp from filename
  TIMESTAMP=$(basename "$f" | cut -d'_' -f1 | sed 's/T/ /' | cut -c1-16)
  
  echo "📁 $PROJECT_NAME"
  echo "   📅 $TIMESTAMP"
  echo "   📄 $f"
  
  # First user message
  FIRST_MSG=$(rg '"role":"user"' "$f" 2>/dev/null | head -1 | sed 's/.*"text":"//; s/\\n.*//; s/".*//' | cut -c1-80)
  [ -n "$FIRST_MSG" ] && echo "   💬 $FIRST_MSG..."
  
  # Matching context
  if [ -n "$TERM2" ]; then
    CONTEXT=$(rg -o ".{0,30}($TERM1|$TERM2).{0,30}" "$f" 2>/dev/null | head -1 | cut -c1-80)
  else
    CONTEXT=$(rg -o ".{0,30}$TERM1.{0,30}" "$f" 2>/dev/null | head -1 | cut -c1-80)
  fi
  [ -n "$CONTEXT" ] && echo "   ✓ ...$CONTEXT..."
  
  echo ""
done

echo "Resume: pi --session <path>"
echo "Export: pi --export <path> output.html"
