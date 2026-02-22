---
name: mac-cleanup
description: Free disk space on macOS using mac-cleanup-go (safe, preview-first, sends to Trash) and docker-cleanup. Run when user asks to clean up, free space, or reclaim disk.
---

# Mac Cleanup

## Tools

- **`mac-cleanup`** — TUI/CLI macOS cleaner (brew install mac-cleanup-go). Preview-first, impact-labeled, sends to Trash.
- **`docker-cleanup`** — Custom Docker space reclaimer at `~/.local/bin/docker-cleanup`

## Quick Commands

```bash
# Preview what would be cleaned
mac-cleanup -clean -dry-run

# Run cleanup with configured targets
mac-cleanup -clean

# Change targets interactively (TUI, needs terminal)
mac-cleanup --select
```

## Config

File: `~/.config/mac-cleanup-go/config.yaml`

```yaml
selected_targets:
  # list of category IDs to clean
```

Edit directly or use `mac-cleanup --select` TUI.

### Current Selection Philosophy

**Included** (safe, auto-regenerated):
- System: trash, system-logs, quicklook, user-diagnostic, incomplete-downloads
- Dev caches: xcode-derived, go-build, go-tools, pip, python-extended (uv/ruff/mypy/pytest), npm, homebrew, docker, deno, frontend-tools, cocoapods, rustup, cloud-cli
- App caches: claude-desktop, discord, notion, obsidian, jetbrains, vscode, cursor, electron-updaters, spotify

**Excluded deliberately**:
- ❌ All browsers (Vivaldi, Chrome, Safari, etc.) — user preference
- ❌ pnpm store — 11GB but shared across all projects, slow to rebuild
- ❌ bun/yarn cache — not worth the re-download time
- ❌ go module cache, cargo, gradle, maven — moderate impact, slow rebuilds
- ❌ Risky storage: iOS backups, old downloads, mail attachments
- ❌ Telegram, Slack, Teams — contain user data

### Available Target IDs (107 total)

Run `mac-cleanup --select` to see all with sizes. Key groups:
- **system**: trash, system-cache, system-logs, quicklook, saved-state, incomplete-downloads, user-diagnostic
- **browser**: browser-chrome, browser-safari, browser-firefox, browser-arc, browser-vivaldi, browser-brave, browser-edge, browser-opera, browser-chromium, browser-zen
- **dev**: xcode-derived, npm, pnpm, yarn, bun, pip, python-extended, poetry, go, go-build, go-tools, cargo, gem, gradle, maven, homebrew, docker, flutter, deno, rustup, frontend-tools, cloud-cli, etc.
- **app**: discord, slack, spotify, vscode, cursor, jetbrains, notion, obsidian, claude-desktop, telegram (manual), etc.
- **storage**: ios-backups, old-downloads, mail-attachments (all risky)

## Agent Workflow

1. **Always dry-run first**: `mac-cleanup -clean -dry-run`
2. **Show user** the report with sizes
3. **Run**: `mac-cleanup -clean`
4. **Verify**: `df -h /` before/after

## Docker Cleanup (separate)

```bash
docker-cleanup  # prunes containers >24h, dangling images, build cache
```

Note: `mac-cleanup` already includes Docker as a builtin target, so `docker-cleanup` is redundant if Docker is in selected_targets. Use `docker-cleanup` only for the MCP container health check.
