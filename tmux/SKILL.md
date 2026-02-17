---
name: tmux
description: Run background processes in tmux panes — dev servers, builds, logs, watchers. Use when you need something running while you keep working.
---

# tmux

Spawn and manage background processes in tmux panes.

## Commands

```bash
# Start a background process
tmux new-window -d -n NAME 'COMMAND'

# Or split current window
tmux split-window -h -d 'COMMAND'    # horizontal split
tmux split-window -v -d 'COMMAND'    # vertical split

# Read output from a pane
tmux capture-pane -t NAME -p -S -50  # last 50 lines

# Send keys / kill
tmux send-keys -t NAME C-c           # Ctrl+C
tmux kill-window -t NAME             # kill it

# List what's running
tmux list-windows -F '#{window_name} #{window_active}'
```

## Examples

```bash
# Dev server
tmux new-window -d -n dev 'npm run dev'
tmux capture-pane -t dev -p -S -20

# Run tests in background
tmux new-window -d -n test 'npm test -- --watch'

# Tail logs
tmux new-window -d -n logs 'tail -f /var/log/app.log'

# Kill when done
tmux send-keys -t dev C-c
tmux kill-window -t dev
```

## Rules

- Always name windows (`-n NAME`) so you can target them
- Use `-d` to stay in current pane (don't switch focus)
- Check output with `capture-pane` before assuming success
- Clean up when done: `kill-window` or `send-keys C-c`
- If not inside tmux, start a session first: `tmux new-session -d -s work`
