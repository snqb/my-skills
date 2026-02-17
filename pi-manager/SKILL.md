---
name: pi-manager
description: Manage the Pi environment - install packages, list extensions, update tools, and query configuration. Includes knowledge of official repositories and community skills.
---

# Pi Manager Skill

Use this skill to manage the Pi environment itself. Install community packages, manage extensions, and keep your agent up to date.

## Tools

### 1. List Packages

View installed packages and extensions.

```bash
pi list
```

### 2. Install Package

Install a package from NPM or Git.

```bash
# From NPM
pi install npm:<package_name>

# From Git
pi install git:<repo_url>
```

**Note:** Installs globally to `~/.pi/agent`. Use `-l` for project-local install.

### 3. Remove Package

Remove an installed package.

```bash
pi remove <package_name>
```

### 4. Update Packages

Update all installed packages to latest versions.

```bash
pi update
```

### 5. Config Check

Check current configuration and enabled resources.

```bash
pi config
```

## Knowledge Base

**Official Repositories:**
- **Core**: `https://github.com/badlogic/pi-mono` (Docs in `packages/coding-agent/docs`)
- **Skills**: `https://github.com/badlogic/pi-skills` (Community skills)

**Finding Skills:**
To find new skills, ask the agent to search GitHub for the `pi-package` topic or check the official `pi-skills` repo.

## Examples

**User:** "Install the linear integration."
**Agent:** `pi install npm:@mariozechner/pi-linear`

**User:** "What extensions do I have?"
**Agent:** `pi list`

**User:** "Update everything."
**Agent:** `pi update`

**User:** "Find a skill for browser automation."
**Agent:** (Searches `badlogic/pi-skills`) -> "Found `browser-tools` in the official repo."
