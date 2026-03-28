<!-- Updated: 2026-03-27 -->
# skills

> Pi agent skills — each subfolder is a self-contained skill loaded on demand.

## How It Works

Pi scans `~/.pi/agent/skills/` (primary) and `~/.agents/skills/` (secondary) at startup.
Each skill = a folder with `SKILL.md` inside. Pi reads the YAML frontmatter to register it.

## Required SKILL.md Format

Every `SKILL.md` **must** have YAML frontmatter with `name` and `description`:

```markdown
---
name: my-skill
description: "One-line description. Tells pi when to load this skill."
---

# Skill Title

...body...
```

Missing frontmatter → startup warning ("description is required").

## Gotchas

- **Frontmatter is mandatory** — without `---` block at top, pi can't register the skill and shows a conflict warning on every launch
- **name must match folder name** — `skills/foo/SKILL.md` → `name: foo`
- **description is the trigger** — pi uses it to decide when to suggest the skill. Make it specific and action-oriented
- **No duplicate names** across `~/.pi/agent/skills/` and `~/.agents/skills/` — first-found wins, collision warning logged
- **Folder structure required** — `skills/foo/SKILL.md`, not `skills/foo.md`. Standalone `.md` files are ignored
- **No personal paths** — use `~` or env vars, never `/Users/username`. Skills may be shared publicly

## Recipes

### Creating a New Skill

1. `mkdir ~/.pi/agent/skills/my-skill`
2. Create `SKILL.md` with frontmatter:
   ```markdown
   ---
   name: my-skill
   description: "What it does. When to use it."
   ---

   # My Skill
   
   ...instructions...
   ```
3. Restart pi or start new session — skill appears in `<available_skills>`

### Full Audit

```bash
# Missing frontmatter
for f in ~/.pi/agent/skills/*/SKILL.md; do
  head -1 "$f" | grep -q '^---' || echo "NO FRONTMATTER: $f"
done

# Missing name field
for f in ~/.pi/agent/skills/*/SKILL.md; do
  awk '/^---$/{c++; next} c==1 && /^name:/{found=1} c==2{exit} END{if(!found) print FILENAME}' "$f"
done

# Standalone files (should be folder/SKILL.md)
find ~/.pi/agent/skills -maxdepth 1 -name "*.md" ! -name "AGENTS.md"

# Personal paths
rg '/Users/' ~/.pi/agent/skills/*/SKILL.md
```
