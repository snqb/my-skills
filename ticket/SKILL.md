---
name: ticket
description: Fast, git-native task tracking using Markdown files. Replaces Beads.
---

# Ticket (tk) - Agentic Task Management

Use this skill for local-first, git-native task tracking. `tk` stores issues as Markdown files in the `.tickets/` directory, making it ideal for agent memory and human-agent collaboration.

## Core Purpose
Maintain state across sessions, track complex dependencies, and provide a clear "Frontier of Work" for coding agents.

## Installation
```bash
curl -o /usr/local/bin/tk https://raw.githubusercontent.com/wedow/ticket/main/tk
chmod +x /usr/local/bin/tk
tk init
```

## Core Commands

### Finding & Viewing Work
- `tk ready`: List tickets that are NOT blocked by dependencies. **Start here.**
- `tk list`: List all open tickets.
- `tk show <id>`: Show full details, description, and dependency status of a ticket.
- `tk blocked`: List tickets that are currently waiting on others.

### Task Management
- `tk create "Title"`: Create a new ticket (returns ID like `T1`).
- `tk status <id> <status>`: Update status (`todo`, `doing`, `done`, `blocked`).
- `tk close <id>`: Move ticket to `.tickets-done/` (or mark as closed).
- `tk edit <id>`: Open the ticket Markdown file for manual editing.

### Dependency Tracking
- `tk dep <child> <parent>`: Make `child` dependent on `parent`.
- `tk dep tree`: Visualize the dependency graph.
- `tk rm-dep <child> <parent>`: Remove a dependency link.

## Session Protocol

### 1. Orient (Session Start)
Always run `tk ready` to see what is actionable. If `.tickets/` doesn't exist, ask the user if you should initialize it to track the current goal.

### 2. Plan (Before Coding)
For non-trivial tasks, break the work into a dependency graph:
1. `tk create "Design schema"` (T1)
2. `tk create "Implement endpoints"` (T2)
3. `tk dep T2 T1`
4. `tk ready` -> shows T1 is the only actionable item.

### 3. Log (During Work)
Update the ticket status as you move through the plan. If you encounter a bug, `tk create` a new ticket for it and `tk dep` the current task on the bug fix.

### 4. Close (Session End)
1. `tk close <ids>` for completed work.
2. `git add .tickets/ .tickets-done/`
3. Commit the changes. State must be pushed/committed to persist.

## Description Guidelines
When creating tickets, always include:
- **Context**: Why are we doing this?
- **Requirements**: Bulleted list of specific goals.
- **Verification**: How will we test it?

## Examples

**Planning a Refactor:**
```bash
tk create "Extract Auth Logic" --id T1
tk create "Update Login Route" --id T2
tk dep T2 T1
tk ready
```

**Checking Status:**
```bash
tk show T1
```
