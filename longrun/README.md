# longrun — Concurrent Streaming Batch Scripts

Pattern for scripts that process lists of items: concurrent inside (pooledMap), streaming out (`.jsonl` line-by-line), async from conversation (tmux). Resume-safe with append mode.

Use for any batch work that takes >10 seconds.
