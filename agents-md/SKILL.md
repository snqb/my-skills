---
name: agents-md
description: Reconcile AGENTS.md files — fix inaccuracies, trim noise, preserve useful context. Use when working in a folder with AGENTS.md, or at session end after architectural decisions.
---

# AGENTS.md Reconciliation

AGENTS.md answers: **"What do I need to know to work here effectively?"**

Not documentation (too distant), not code comments (too granular). The middle layer that captures:
- How it works (orientation)
- What will bite you (gotchas)  
- How to do things (recipes)
- What not to touch (landmines)

## Invocation

```
"update agents for countries/kg"
"reconcile agents in monitoring/"
"agents-md ."
```

## Core Principle: Density Over Brevity

A 60-line file with useful content beats a 20-line file missing key context.

**Keep:**
- How it works — mental model, data flow
- Gotchas — things that break unexpectedly
- Recipes — "how to add X", "how to test Y"
- Landmines — fragile files, don't-touch warnings
- Key examples — one good code snippet beats three paragraphs

**Remove:**
- File listings — agent can `ls`
- Generic advice — "use type hints", "follow conventions"
- ASCII art — unless it genuinely clarifies
- Stale references — deleted files, renamed functions
- Duplicated docs — link instead of copy

## Workflow

### 1. Read & Timestamp Check

```bash
cd <target_directory>
cat AGENTS.md 2>/dev/null || echo "No AGENTS.md"
grep -oP '(?<=<!-- Updated: )\d{4}-\d{2}-\d{2}' AGENTS.md
```

### 2. Detect Changes

```bash
LAST_UPDATE=$(git log -1 --format=%ci -- AGENTS.md 2>/dev/null | cut -d' ' -f1)
[ -z "$LAST_UPDATE" ] && LAST_UPDATE="1970-01-01"
git log --since="$LAST_UPDATE" --name-status --oneline -- . | head -40
```

### 3. Verify References

```bash
grep -oE '[a-zA-Z0-9_/.-]+\.(py|js|ts|sh|md|json|yaml|yml)' AGENTS.md | sort -u | while read f; do
  [ ! -e "$f" ] && echo "STALE: $f"
done
```

For functions/classes, grep or use code-intelligence skill.

### 4. Evaluate Each Section

| Question | If Yes |
|----------|--------|
| Is it **wrong**? | Fix immediately — worst kind of AGENTS.md |
| Is it **stale**? | Remove or update |
| Is it **useful**? | Keep, maybe condense |
| Is it **noise**? | Remove |
| Is it **generic**? | Remove — agent knows "best practices" |

### 5. Propose Changes

Show before/after comparison with clear categories:
- **Fix**: Factual corrections
- **Remove**: Noise, stale, generic
- **Keep**: Useful context (may condense)
- **Add**: New learnings from session

### 6. Cross-Folder Check

> "This also affects `../AGENTS.md` — want me to suggest an update?"

Don't auto-propagate. Suggest, get approval.

### 7. Write

```markdown
<!-- Updated: YYYY-MM-DD -->
# folder_name

...content...
```

## Template (Flexible)

Use sections that fit. Skip empty ones:

```markdown
<!-- Updated: YYYY-MM-DD -->
# folder_name

> One-line purpose

## How It Works
Mental model, data flow — can use simple diagram:
```
input → process → output
```

## Gotchas
- Non-obvious thing that will bite you
- Another gotcha

## Recipes

### How to Add X
1. Step one
2. Step two
   ```python
   example_code()
   ```

### How to Test Y
```bash
command to run
```

## Don't Touch
- `fragile.py` — reason why

## See Also
- [Related doc](path/to/doc.md)
```

## Line Budget (Guidelines)

| Level | Range |
|-------|-------|
| Project root | 60-120 lines |
| Major subsystem | 30-60 lines |
| Leaf directory | 15-40 lines |

Skip AGENTS.md entirely if:
- Directory is tiny and obvious
- Parent already covers it
- Nothing non-obvious to say

## Quality Checklist

Before finalizing:
- [ ] All file paths exist
- [ ] All function/class names exist
- [ ] No factual errors
- [ ] No generic filler
- [ ] Recipes still work
- [ ] Useful context preserved

## Example Reconciliation

**Before (100 lines, has errors):**
```markdown
## Quick Navigation
- `__init__.py`, `loader.py`, `helpers.py`  ← noise, ls does this

## Architecture
┌──────────────────────┐
│  ASCII box           │  ← noise
└──────────────────────┘

## Best Practices
1. Never hardcode strings  ← generic
2. Use type hints          ← generic

Use the `I18nKey` Enum...  ← WRONG: it's a Literal
```

**After (55 lines, accurate):**
```markdown
## How It Works
get_text(state, key) → helpers extracts country → loader imports texts → cached Pydantic field

## Gotchas
- `I18nKey` is a Literal, not Enum — don't edit manually  ← FIXED
- Texts live at project root, not here

## Recipes
### Adding a Translation
1. Add to base model
2. Override in country texts
3. Regenerate: `python scripts/generate_i18n_keys.py`
```

**Result:** 45% smaller, all useful content preserved, error fixed.
