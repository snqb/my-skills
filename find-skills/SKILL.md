---
name: find-skills
description: Discover and install agent skills from pi ecosystem and skills.sh. Use when user asks "is there a skill for X", "find a skill", "how do I do X" (where X might have a skill), or wants to extend capabilities.
---

# Find Skills

**Pi-first** search across three tiers, always in this order:

1. **Pi built-in examples** — official extensions/skills bundled with pi itself
2. **Pi ecosystem** — `badlogic/pi-skills` repo + `pi-package` topic on GitHub
3. **Skills.sh** — broader community (Claude Code compatible, not pi-native)

## Workflow

### 1. Check Pi Built-in Examples (ALWAYS FIRST)

Pi ships with example extensions and skills. These are the most idiomatic, maintained by the pi author.

```bash
# List all built-in example extensions
ls /opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/

# Read a specific one (many are single .ts files, some are directories)
cat /opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/handoff.ts
cat /opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/subagent/README.md

# Search for keyword in examples
grep -rl "keyword" /opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/examples/
```

**Key built-in extensions:**

| Extension | What it does |
|-----------|-------------|
| `subagent/` | Spawn sub-agents (single, parallel, chain). Full orchestration. |
| `handoff.ts` | Transfer context to new focused session via LLM summary |
| `send-user-message.ts` | Inject user messages programmatically |
| `reload-runtime.ts` | Reload command + LLM tool handoff |
| `confirm-destructive.ts` | Confirm session switches/forks |
| `git-checkpoint.ts` | Git stash on turn end / fork |
| `plan-mode/` | Read-only exploration mode |
| `todo.ts` | Task tracking |
| `custom-compaction.ts` | Custom context compaction |
| `sandbox/` | Sandboxed execution |
| `interactive-shell.ts` | Interactive shell integration |

Also check pi docs for built-in features (`/fork`, `/tree`, AgentSession SDK):

```bash
# Check docs for relevant features
grep -ri "keyword" /opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/docs/
```

### 2. Check Pi Official Skills Repo

```bash
# List official skills
gh api repos/badlogic/pi-skills/contents | jq -r '.[] | select(.type=="dir") | .name'

# Read a skill
gh api repos/badlogic/pi-skills/contents/SKILL_NAME/SKILL.md | jq -r '.content' | base64 -d
```

### 3. Search Pi Community Packages (GitHub topic: pi-package)

```bash
# Find community pi packages
gh search repos --topic pi-package --json fullName,description,stargazersCount --limit 30

# Search within results for keyword
gh search repos --topic pi-package --json fullName,description,stargazersCount --limit 30 | \
  jq -r '.[] | select(.description | test("KEYWORD"; "i")) | "\(.fullName) ⭐\(.stargazersCount) — \(.description)"'

# Inspect a specific package
gh api repos/OWNER/REPO/contents | jq -r '.[] | "\(.type) \(.name)"'
```

**Known pi-package repos:**

| Repo | Description |
|------|-------------|
| `joelhooks/pi-tools` | Repo autopsy, session reader, codex loops, and more |
| `ben-vargas/pi-packages` | Collection: ancestor-discovery, synthetic-provider, etc. |
| `EmZod/pi-subagent-with-logging` | Git-based orchestration logging, shadow-git, Mission Control |
| `juanibiapina/pi-powerbar` | Persistent powerline status bar |
| `juanibiapina/pi-plan` | Plan mode extension |
| `juanibiapina/pi-files` | Track files read/written by agent |
| `tintinweb/pi-manage-todo-list` | Structured todo list with progress widgets |
| `tintinweb/pi-messenger-bridge` | Bridge Telegram/WhatsApp/Slack/Discord |
| `tintinweb/pi-schedule-prompt` | Schedule/defer prompts at specific times |

### 4. Search Skills.sh (LAST — not pi-native)

Skills.sh skills are Claude Code compatible but not pi-specific. They work as plain markdown skills.

```bash
npx skills find KEYWORD
```

Install with:
```bash
npx skills add owner/repo@skill -g -y
```

## Installing

```bash
# Pi package (from npm)
pi install npm:@foo/bar

# Pi package (from git)
pi install git:github.com/user/repo
pi install https://github.com/user/repo

# Local path
pi install ./local/path

# Try without installing (current run only)
pi -e npm:@foo/bar
pi -e git:github.com/user/repo

# Project-local install (shared with team)
pi install -l npm:@foo/bar

# Skills.sh (not a pi package — goes to ~/.my-skills/)
npx skills add owner/repo@skill -g -y

# Manage
pi list     # show installed packages
pi update   # update all non-pinned
pi remove npm:@foo/bar
```

## Built-in Extension Installation

Pi built-in examples need symlinking (they're reference implementations):

```bash
# Single-file extension
ln -sf /opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/handoff.ts \
  ~/.pi/agent/extensions/handoff.ts

# Directory extension (e.g. subagent)
mkdir -p ~/.pi/agent/extensions/subagent
ln -sf /opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/subagent/index.ts \
  ~/.pi/agent/extensions/subagent/index.ts
ln -sf /opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/subagent/agents.ts \
  ~/.pi/agent/extensions/subagent/agents.ts
```

## When Nothing Found

1. Check if pi has a built-in feature (e.g., `/fork`, `/tree` are built-in commands)
2. Check if an extension example covers it
3. Offer to help build it directly
4. Suggest creating a package: ask pi to help bundle it
