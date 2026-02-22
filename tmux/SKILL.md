---
name: tmux
description: Run background processes in tmux panes — dev servers, builds, logs, watchers. Use when you need something running while you keep working.
---

# tmux

Spawn and manage background processes in tmux panes.
**Rule: ALL long-running scripts/commands go to tmux. Never block the main thread.**

## Session Convention

Use a single session `pi` with named windows per task:

```bash
# Ensure session exists
tmux has-session -t pi 2>/dev/null || tmux new-session -d -s pi

# Start a background process
tmux new-window -d -t pi -n NAME 'COMMAND'

# Read output
tmux capture-pane -t pi:NAME -p -S -50

# Send keys / kill
tmux send-keys -t pi:NAME C-c
tmux kill-window -t pi:NAME

# List what's running
tmux list-windows -t pi -F '#{window_name} #{pane_current_command} #{window_active}'
```

## iTerm2 Visual Tab (optional)

When the user asks to "show", "open pane", "покажи" — open a new iTerm **tab** with tmux attached.
Note: iTerm splits don't work from pi's context; tabs do.

```bash
osascript -e '
tell application "iTerm2"
  tell current window
    set newTab to (create tab with default profile)
    tell current session of newTab
      write text "tmux attach -t pi:NAME"
    end tell
  end tell
end tell'
```

**Default is background-only (silent tmux).** Visual tab only when explicitly requested.

## Workflow Pattern

```bash
# 1. Start
tmux has-session -t pi 2>/dev/null || tmux new-session -d -s pi
tmux new-window -d -t pi -n mytest 'cd /path && python test.py'

# 2. Check (poll output without switching)
sleep 2
tmux capture-pane -t pi:mytest -p -S -30

# 3. Report result to user from captured output

# 4. Cleanup when done
tmux kill-window -t pi:mytest 2>/dev/null
```

## Cleanup

**After task completes**: Always `kill-window` when the process is done and output captured.

**Session hygiene check** (run periodically or at session start):

```bash
# Show all pi windows
tmux list-windows -t pi -F '#{window_name} #{pane_dead} #{pane_current_command}' 2>/dev/null

# Kill dead panes (process exited)
for w in $(tmux list-windows -t pi -F '#{window_index}:#{pane_dead}' 2>/dev/null | grep ':1$' | cut -d: -f1); do
  tmux kill-window -t "pi:$w"
done

# Nuclear: kill entire pi session
tmux kill-session -t pi 2>/dev/null
```

## Rules

- **Never block main thread** — all scripts, builds, servers → tmux
- Always use session `pi`, name windows (`-n NAME`)
- Use `-d` to stay in current pane (don't switch focus)
- Check output with `capture-pane` before assuming success
- **Clean up when done**: `kill-window` after capturing results
- Short commands (<5s) can run inline — tmux for things that take time
- Visual iTerm tab only when explicitly requested (splits don't work from pi)
