---
name: takopi
description: Telegram bridge for pi, Claude Code, Codex, and OpenCode. Remote coding from your phone — projects, worktrees, file transfer, voice notes, session resume. Use when working with takopi config, projects, or Telegram-based agent workflows.
---

# takopi — Telegram Bridge for Coding Agents

Repo: [banteg/takopi](https://github.com/banteg/takopi) (761⭐)
Docs: [takopi.dev](https://takopi.dev/)

## What It Does

Telegram ↔ agent CLI bridge. Send messages from Telegram, agent runs on your server, streams progress back. Supports pi, Claude Code, Codex, OpenCode as engines.

## Install

```bash
uv tool install -U takopi
```

Requires: `uv`, Python 3.14+, at least one engine CLI on PATH (`pi`, `claude`, `codex`, `opencode`).

## Quick Start

```bash
cd ~/my-project
takopi              # setup wizard on first run
takopi --onboard    # re-run wizard
takopi --debug      # debug logging to debug.log
takopi doctor       # validate telegram + config
```

## Telegram Commands

| Command | Description |
|---------|-------------|
| `/<engine>` | Use engine for this message: `/pi`, `/claude`, `/codex`, `/opencode` |
| `/<project>` | Target a registered project |
| `@branch` | Run in a git worktree for that branch |
| `/cancel` | Reply to progress message to stop run |
| `/new` | Clear session, start fresh thread |
| `/agent` | Show current default engine |
| `/agent set <engine>` | Set default engine for chat/topic |
| `/agent clear` | Remove default engine |
| `/ctx` | Show current context binding |
| `/ctx set <project> [@branch]` | Bind context |
| `/ctx clear` | Remove context binding |
| `/model` | Show/set model override |
| `/file put <path>` | Upload file to repo (needs file transfer enabled) |
| `/file get <path>` | Fetch file/dir from repo (dirs auto-zipped) |
| `/topic <project> @branch` | Create/bind forum topic |

### Directive Combinations

```
/pi fix the auth bug                          # engine only
/dota read the README                         # project only
/dota @feat/new-detector improve accuracy     # project + branch
/claude /dota @main refactor pipeline         # engine + project + branch
```

Directives are parsed from the start of the first line only. Order doesn't matter.

## Projects

### Register a project

```bash
cd ~/mobile-research/twitch-autohighlights-dota2
takopi init dota
```

Or via config:

```bash
takopi config set projects.dota.path "~/mobile-research/twitch-autohighlights-dota2"
takopi config set projects.dota.default_engine "pi"
```

### TOML equivalent (`~/.takopi/takopi.toml`)

```toml
[projects.dota]
path = "~/mobile-research/twitch-autohighlights-dota2"
default_engine = "pi"

[projects.research]
path = "~/mobile-research"
default_engine = "pi"
```

### Set default project

```bash
takopi config set default_project "research"
```

### Use from Telegram

```
/dota explain the highlight detection pipeline
/dota @feat/audio add audio-based detection
/research find papers on game highlight detection
```

Reply to continue in the same project+branch context (the `ctx:` footer carries forward).

## Worktrees

Run on feature branches without touching main checkout:

```bash
takopi config set projects.dota.worktrees_dir ".worktrees"
takopi config set projects.dota.worktree_base "main"
```

```
/dota @feat/audio-detect add whisper-based kill detection
```

Creates `.worktrees/feat/audio-detect` as a git worktree.

## Conversation Modes

| Workflow | Session Mode | Topics | Resume Lines |
|----------|-------------|--------|--------------|
| **assistant** | chat (auto-resume) | off | hidden |
| **workspace** | chat | on (forum topics) | hidden |
| **handoff** | stateless | off | shown |

### Chat mode (recommended for personal use)

Just send messages — auto-resumes the current thread. `/new` to reset.

```bash
takopi config set transports.telegram.session_mode "chat"
takopi config set transports.telegram.show_resume_line false
```

### Stateless mode

Every message is independent. Reply to a message to continue that session.

## Engine Config

### Pi engine

```toml
[pi]
model = "claude-opus-4-6"
provider = "anthropic"
extra_args = []
```

```bash
takopi config set pi.model "claude-opus-4-6"
takopi config set pi.provider "anthropic"
```

### Claude Code engine

```toml
[claude]
model = "claude-sonnet-4-5-20250929"
allowed_tools = ["Bash", "Read", "Edit", "Write"]
dangerously_skip_permissions = false
```

### Engine selection precedence (highest wins)

1. Resume token (from reply)
2. Explicit directive (`/claude ...`)
3. Topic default (`/agent set`)
4. Chat default (`/agent set`)
5. Project default (`default_engine`)
6. Global default (`default_engine` at top level)

## File Transfer

```bash
takopi config set transports.telegram.files.enabled true
takopi config set transports.telegram.files.auto_put true
```

- Upload files: attach document or `/file put docs/spec.pdf`
- Download files: `/file get src/main.py`
- Dirs auto-zipped on download
- 20 MiB upload / 50 MiB download limits

## Voice Notes

```bash
takopi config set transports.telegram.voice_transcription true
```

Requires `OPENAI_API_KEY` in environment. Transcribes voice → runs as text prompt.

## Forum Topics (Workspace Mode)

Bind Telegram forum threads to project+branch:

```bash
takopi config set transports.telegram.topics.enabled true
takopi config set transports.telegram.topics.scope "auto"
```

Inside a topic: `/topic dota @feat/audio` to bind it.

## Schedule Tasks

Use Telegram's built-in schedule: long-press send → Schedule Message.

## Config Hot-Reload

```bash
takopi config set watch_config true
```

Edit `~/.takopi/takopi.toml` while takopi is running — changes apply immediately (except transport).

## CLI Reference

| Command | Description |
|---------|-------------|
| `takopi` | Start (runs wizard if no config) |
| `takopi <engine>` | Start with specific engine |
| `takopi init <alias>` | Register current repo as project |
| `takopi chat-id` | Capture current chat ID |
| `takopi doctor` | Validate config + Telegram |
| `takopi plugins` | List plugins |
| `takopi config list` | Show all config |
| `takopi config get <key>` | Get config value |
| `takopi config set <key> <value>` | Set config value |

## Full Config Reference (`~/.takopi/takopi.toml`)

```toml
watch_config = true
default_engine = "pi"
default_project = "research"
transport = "telegram"

[transports.telegram]
bot_token = "..."
chat_id = 123456789
allowed_user_ids = [123456789]
session_mode = "chat"
show_resume_line = false
message_overflow = "split"    # "trim" | "split"
voice_transcription = false

[transports.telegram.files]
enabled = true
auto_put = true
auto_put_mode = "upload"      # "upload" | "prompt"
uploads_dir = "incoming"

[transports.telegram.topics]
enabled = false
scope = "auto"                # "auto" | "main" | "projects" | "all"

[pi]
model = "claude-opus-4-6"
provider = "anthropic"
extra_args = []

[claude]
model = "claude-sonnet-4-5-20250929"
allowed_tools = ["Bash", "Read", "Edit", "Write"]

[projects.dota]
path = "~/mobile-research/twitch-autohighlights-dota2"
default_engine = "pi"
worktrees_dir = ".worktrees"
worktree_base = "main"

[projects.research]
path = "~/mobile-research"
default_engine = "pi"
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Bot doesn't respond | Check takopi is running in tmux. `takopi doctor` |
| "unknown project" | Run `takopi init <alias>` in the repo first |
| Engine CLI not found | Install engine, ensure it's on PATH |
| Resume doesn't work | Reply to message with resume line, or use chat mode |
| Progress stuck on "starting" | Agent doing slow work, or `/cancel` and retry |
| Context not carrying forward | Reply to `ctx:` message, or set `default_project` |

## Docs Index

- Install: [tutorials/install.md](https://github.com/banteg/takopi/blob/master/docs/tutorials/install.md)
- First run: [tutorials/first-run.md](https://github.com/banteg/takopi/blob/master/docs/tutorials/first-run.md)
- Projects: [how-to/projects.md](https://github.com/banteg/takopi/blob/master/docs/how-to/projects.md)
- Worktrees: [how-to/worktrees.md](https://github.com/banteg/takopi/blob/master/docs/how-to/worktrees.md)
- File transfer: [how-to/file-transfer.md](https://github.com/banteg/takopi/blob/master/docs/how-to/file-transfer.md)
- Topics: [how-to/topics.md](https://github.com/banteg/takopi/blob/master/docs/how-to/topics.md)
- Voice: [how-to/voice-notes.md](https://github.com/banteg/takopi/blob/master/docs/how-to/voice-notes.md)
- Config: [reference/config.md](https://github.com/banteg/takopi/blob/master/docs/reference/config.md)
- Commands: [reference/commands-and-directives.md](https://github.com/banteg/takopi/blob/master/docs/reference/commands-and-directives.md)
- Context: [reference/context-resolution.md](https://github.com/banteg/takopi/blob/master/docs/reference/context-resolution.md)
- Plugins: [docs/plugins.md](https://github.com/banteg/takopi/blob/master/docs/plugins.md)
