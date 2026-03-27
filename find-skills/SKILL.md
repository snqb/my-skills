---
name: find-skills
description: Discover and install agent skills from pi ecosystem and skills.sh. Use when user asks "is there a skill for X", "find a skill", "how do I do X" (where X might have a skill), or wants to extend capabilities.
---

# Find Skills

Search across all skill sources to find what the user needs. Cast wide, filter down.

## Search Strategy

Run **multiple** searches in parallel — different sources index different things. Don't stop at first hit.

### 1. Skills.sh Registry (broadest, most installable)

```bash
npx skills find KEYWORD
```

Returns install counts + one-click install commands. Best for generic capabilities.

### 2. GitHub Topic Search

```bash
# Pi-native packages
gh search repos --topic pi-package --json fullName,description,stargazersCount --limit 30 | \
  jq -r 'sort_by(-.stargazersCount)[] | "\(.fullName) ⭐\(.stargazersCount) — \(.description)"'

# Broader agent skills ecosystem
gh search repos --topic agent-skills --json fullName,description,stargazersCount --limit 30 | \
  jq -r 'sort_by(-.stargazersCount)[] | "\(.fullName) ⭐\(.stargazersCount) — \(.description)"'
```

### 3. Major Skill Repositories (search inside these)

These repos contain hundreds of curated skills. Search their catalogs/directories:

| Repo | Skills | How to search |
|------|--------|---------------|
| `sickn33/antigravity-awesome-skills` | 1300+ | `gh api repos/sickn33/antigravity-awesome-skills/contents/CATALOG.md \| jq -r '.content' \| base64 -d \| grep -i KEYWORD` |
| `obra/superpowers` | ~15 high-quality | `gh api repos/obra/superpowers/contents/skills \| jq -r '.[] \| .name'` |
| `anthropics/skills` | ~17 official | `gh api repos/anthropics/skills/contents/skills \| jq -r '.[] \| .name'` |
| `vercel-labs/agent-skills` | Collection | `gh api repos/vercel-labs/agent-skills/contents/skills \| jq -r '.[] \| .name'` |
| `K-Dense-AI/claude-scientific-skills` | Science/research | `gh api repos/K-Dense-AI/claude-scientific-skills/contents \| jq -r '.[] \| .name'` |
| `ComposioHQ/awesome-claude-skills` | Curated list | `gh api repos/ComposioHQ/awesome-claude-skills/contents \| jq -r '.[] \| select(.type=="dir") \| .name'` |
| `VoltAgent/awesome-agent-skills` | 1000+ curated | Check README for categorized list |
| `hesreallyhim/awesome-claude-code` | Curated awesome list | Check README for skills section |
| `phuryn/pm-skills` | 100+ PM/product | `gh api repos/phuryn/pm-skills/contents \| jq -r '.[] \| select(.type=="dir") \| .name'` |

#### Reading a skill before installing

```bash
# From any repo with SKILL.md convention
gh api repos/OWNER/REPO/contents/skills/SKILL_NAME/SKILL.md | jq -r '.content' | base64 -d

# Or for flat structure
gh api repos/OWNER/REPO/contents/SKILL_NAME/SKILL.md | jq -r '.content' | base64 -d
```

### 4. GitHub Code Search (find SKILL.md files anywhere)

```bash
# Search for SKILL.md files containing a keyword
gh search code "KEYWORD" --filename SKILL.md --json repository,path --limit 20 | \
  jq -r '.[] | "\(.repository.fullName) — \(.path)"'

# Search for agent instructions containing a keyword  
gh search code "KEYWORD" --filename AGENTS.md --json repository,path --limit 10 | \
  jq -r '.[] | "\(.repository.fullName) — \(.path)"'
```

### 5. GitHub Repo Search (for niche/specific tools)

```bash
# Broader search when skills registries don't have it
gh search repos "KEYWORD skill agent" --json fullName,description,stargazersCount --limit 20 | \
  jq -r 'sort_by(-.stargazersCount)[] | "\(.fullName) ⭐\(.stargazersCount) — \(.description)"'
```

### 6. Pi Built-in Extensions & Docs

```bash
# Built-in extensions
ls /opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/

# Search pi docs
grep -ri "KEYWORD" /opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/docs/
```

Key built-ins: `subagent/`, `handoff.ts`, `plan-mode/`, `todo.ts`, `git-checkpoint.ts`, `sandbox/`, `interactive-shell.ts`, `custom-compaction.ts`

### 7. Pi Official Skills Repo

```bash
gh api repos/badlogic/pi-skills/contents | jq -r '.[] | select(.type=="dir") | .name'
gh api repos/badlogic/pi-skills/contents/SKILL_NAME/SKILL.md | jq -r '.content' | base64 -d
```

## Quick Check: Already Installed?

Before searching external, verify it's not already local:

```bash
# Search local skill names and descriptions
rg -l "KEYWORD" ~/.pi/agent/skills/ ~/.agents/skills/ --type md
```

## Fusion, Not Replacement

Local skills have a character — opinionated tool choices, workflows, philosophy from AGENTS.md (deno-first, LLM over heuristics, data over objects, ABP for browser, etc.). External skills are generic. **Always fuse, never blindly install.**

### Decision tree when you find something good:

1. **Local skill exists in the same domain?** → Load `enrich-skill`. Gap-analyze, take what's missing, merge it in. Preserve local style, tool preferences, and working commands.

2. **New domain, no local skill?** → Read the external SKILL.md. Before installing, adapt it:
   - Strip generic boilerplate, keep actionable patterns
   - Align tool choices with local preferences (e.g. `deno` not `node`, `uv` not `pip`)
   - Remove content that contradicts AGENTS.md philosophy
   - Add it as a new skill under `~/.pi/agent/skills/` with your voice

3. **External skill is just a reference/cheatsheet?** → Don't install. Extract the 3-5 useful things and fold them into the relevant existing skill.

### Multi-skill fusion

The best skills come from synthesizing many sources, not copying one. When a domain is covered by multiple external skills, **fuse them into a single local skill** that's better than any individual source.

**Process:**
1. Search broadly — collect 3-8 skills touching the same domain from different repos/authors
2. Read all of them — each will have different angles, blind spots, and strengths
3. Extract the non-overlapping wisdom from each — the unique insight, not the boilerplate
4. Synthesize into one cohesive skill with a clear workflow, not a pile of copied sections
5. Adapt to local character — tool choices, philosophy, voice

**Example:** User wants a skill for "API design". You find:
- `antigravity/api-design` — REST conventions, status codes
- `wshobson/backend-development/api-security` — auth patterns, rate limiting
- `obra/superpowers/verification-before-completion` — contract testing mindset
- skills.sh `openapi-spec` — schema-first workflow
- some GitHub SKILL.md — versioning strategies

None of these alone is complete. Fuse them: schema-first workflow + REST conventions + auth patterns + versioning + contract testing → one `api-design` skill that covers the full lifecycle.

**Existing fusions in this library:**
- `research` = exa + serper + github + hn orchestrated
- `design` = component-craft + ui-design + shadcn + mobile-first + photos routed through one hub
- `exa-notebooklm` = exa search + notebooklm RAG pipelined
- `scripting` = deno + python decision router

## Installing

```bash
# Skills.sh (most common)
npx skills add owner/repo@skill -g -y

# Pi package (npm)
pi install npm:@foo/bar

# Pi package (git)
pi install git:github.com/user/repo

# Try without installing (current session only)
pi -e npm:@foo/bar

# Project-local
pi install -l npm:@foo/bar

# Manual: copy SKILL.md from any GitHub repo
mkdir -p ~/.pi/agent/skills/SKILL_NAME
# paste or download SKILL.md into it

# Built-in extension (symlink)
ln -sf /opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/EXTENSION \
  ~/.pi/agent/extensions/EXTENSION

# Manage
pi list          # installed packages
pi update        # update all
pi remove npm:@foo/bar
```

## When Nothing Found

1. Check if pi has it built-in (`/fork`, `/tree`, etc.)
2. Offer to **build it** — most skills are just a SKILL.md file
3. Suggest `enrich-skill` to upgrade an existing skill that's close
