---
name: autoresearch
description: "Autonomous experiment loop — modify code, measure, keep/discard, repeat forever. Based on Karpathy's autoresearch pattern. Use when there's working code + a measurable metric to optimize. Agent works while you sleep."
user-invocable: true
argument-hint: [path/to/program.md]
---

# Autoresearch

Autonomous experiment loop. You have working code and a metric. You modify, measure, keep or discard, repeat. Forever. Until the human stops you.

Based on [karpathy/autoresearch](https://github.com/karpathy/autoresearch).

## Requirements

Before starting, the project MUST have:

1. **Working code** that produces a measurable result
2. **An eval command** that outputs a number (lower or higher = better, defined in program.md)
3. **A `program.md`** in the project root — the research strategy

If any of these are missing, help the user create them first. Don't start the loop without all three.

## program.md

This is the ONLY file the human writes. It tells you everything:

```markdown
# Autoresearch: <Project Name>

## Scope
- Files you CAN modify: <list>
- Files you CANNOT modify: <list>
- You CANNOT install new dependencies

## Eval
Command: `<command that outputs the metric>`
Metric: `<name>` (lower is better | higher is better)
Time budget: <N> minutes per experiment
Parse: `grep "^<metric>:" run.log` or similar

## Strategy
<What to try. Research directions. Constraints. Philosophy.>

## Notes
<Anything else the agent should know>
```

A good program.md is specific. Bad: "make it faster". Good: "try SIMD for the hot loop in parse.rs, experiment with different batch sizes in process(), consider replacing HashMap with BTreeMap for sorted iteration".

## Setup

When the user says "start autoresearch" or points you at a program.md:

1. **Read program.md** — understand scope, eval, strategy
2. **Read all in-scope files** — full context
3. **Agree on a run tag** with the user (e.g. `apr2`, `v3-perf`)
4. **Create branch**: `git checkout -b autoresearch/<tag>`
5. **Run baseline** — execute eval command on unmodified code, record result
6. **Initialize results.jsonl** — first entry is the baseline
7. **Confirm with user** — show baseline, confirm everything works
8. **Start the loop** — from here, fully autonomous

## The Loop

Run in tmux (background, survives disconnects):

```
LOOP FOREVER:

1. Review state
   - Current best metric
   - What's been tried (scan results.jsonl)
   - What directions remain from program.md

2. Form hypothesis
   - One clear idea, one change
   - Write it as a commit message BEFORE coding

3. Modify code
   - Only files in scope
   - Keep changes minimal and reviewable

4. Commit
   git add -A && git commit -m "exp: <description>"

5. Run experiment
   <eval command> > run.log 2>&1
   - Redirect everything. Do NOT flood context with training output.
   - If exceeds 2× time budget, kill it → treat as crash

6. Read result
   Parse metric from run.log
   If empty → crash. Read `tail -50 run.log` for stack trace.

7. Decide
   IMPROVED (metric better):
     → Log as "keep" in results.jsonl
     → This commit becomes new baseline
     → Continue from here

   WORSE OR EQUAL:
     → Log as "discard" in results.jsonl
     → git reset --hard HEAD~1
     → Back to previous best

   CRASH:
     → If trivial fix (typo, import): fix and retry once
     → Otherwise: log as "crash", git reset --hard HEAD~1, move on

8. GOTO 1

NEVER STOP. NEVER ASK "should I continue?".
The human may be asleep. Work until interrupted.
```

## Logging

Append one JSON line per experiment to `results.jsonl` (untracked by git):

```jsonl
{"n":0,"commit":"a1b2c3d","metric":0.998,"status":"keep","description":"baseline","timestamp":"2026-04-02T03:10:00Z"}
{"n":1,"commit":"b2c3d4e","metric":0.993,"status":"keep","description":"increase LR to 0.04","timestamp":"2026-04-02T03:15:00Z"}
{"n":2,"commit":"c3d4e5f","metric":1.005,"status":"discard","description":"switch to GeLU activation","timestamp":"2026-04-02T03:20:00Z"}
{"n":3,"commit":"d4e5f6g","metric":null,"status":"crash","description":"double model width (OOM)","timestamp":"2026-04-02T03:25:00Z"}
```

Add `results.jsonl` and `run.log` to `.gitignore` if not already there.

## Simplicity Criterion

From Karpathy:

> All else being equal, simpler is better. A small improvement that adds ugly complexity is not worth it. Removing something and getting equal or better results is a great outcome. Weigh the complexity cost against the improvement magnitude.

- 0.001 improvement + 20 lines of hack → probably not worth it
- 0.001 improvement from DELETING code → definitely keep
- ~0 change but simpler code → keep

## When Stuck

If you run out of ideas, in order:

1. Re-read program.md strategy section
2. Re-read the in-scope files — look for patterns you missed
3. Try combining two previous near-misses
4. Try the opposite of what's been working
5. Try something radical — different algorithm, different approach entirely
6. Review discarded experiments — was something promising that you gave up on too early?

Do NOT stop. Think harder.

## Running in tmux

Start the loop in tmux so it survives terminal disconnects:

```bash
# Create or attach to tmux session
tmux new-session -d -s autoresearch 2>/dev/null || true
tmux send-keys -t autoresearch "cd <project-dir>" Enter
```

The agent runs inside the tmux session. User can:
- `tmux attach -t autoresearch` — watch live
- Check `results.jsonl` anytime — see progress
- `Ctrl+C` or kill the agent — stop the loop

## Checking Progress

When the user asks "how's it going?" or comes back in the morning:

```bash
# Summary
echo "Experiments: $(wc -l < results.jsonl)"
echo "Keeps: $(grep '"keep"' results.jsonl | wc -l)"
echo "Best: $(grep '"keep"' results.jsonl | jq -r '.metric' | sort -n | head -1)"
echo "---"
# Last 5 experiments
tail -5 results.jsonl | jq -r '"\(.n). \(.status) \(.metric // "crash") — \(.description)"'
```

Or a proper summary:

```bash
# Full experiment history
jq -r '"#\(.n) [\(.status)] \(.metric // "crash") — \(.description)"' results.jsonl
```

## Examples

### ML Training (Karpathy's original)
```markdown
## Scope
- CAN modify: train.py
- CANNOT modify: prepare.py, pyproject.toml

## Eval
Command: `uv run train.py`
Metric: val_bpb (lower is better)
Time budget: 5 minutes
Parse: `grep "^val_bpb:" run.log`
```

### API Latency
```markdown
## Scope
- CAN modify: src/handlers/, src/db/queries/

## Eval
Command: `cargo build --release && wrk -t4 -c100 -d30s http://localhost:8080/api/search`
Metric: Req/Sec (higher is better)
Time budget: 2 minutes
Parse: `grep "Req/Sec" run.log | awk '{print $2}'`
```

### Prompt Optimization
```markdown
## Scope
- CAN modify: prompts/system.txt

## Eval
Command: `python eval_prompt.py --dataset eval_set.jsonl`
Metric: accuracy (higher is better)
Time budget: 3 minutes
Parse: `grep "^accuracy:" run.log`
```

### Bundle Size
```markdown
## Scope
- CAN modify: src/, package.json (deps only)

## Eval
Command: `npm run build && du -sb dist/ | cut -f1`
Metric: bytes (lower is better)
Time budget: 1 minute
Parse: the entire stdout is the number
```

### Lighthouse
```markdown
## Scope
- CAN modify: src/components/, src/styles/

## Eval
Command: `npm run build && npx lighthouse http://localhost:3000 --output=json --chrome-flags="--headless" | jq '.categories.performance.score'`
Metric: performance score (higher is better)
Time budget: 2 minutes
Parse: the entire stdout is the number
```
