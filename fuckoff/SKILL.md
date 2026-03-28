---
name: fuckoff
description: "Generate a short handoff report from the current session. Collects git changes, screenshots, context automatically. Use when task is done and user says 'отчёт', 'report', 'скинь клиенту', 'fuckoff', or needs to hand off work."
---

# Fuckoff Report

Auto-generate a handoff report from the current session. Client-facing, minimal, human.

## Steps

### 1. Collect context (automatic, no questions)

```bash
# What changed
git log --oneline -5
git diff HEAD~1 --stat

# Screenshots from this session (last hour)
find /var/folders -name "screenshot-*.webp" -mmin -60 2>/dev/null | sort
```

### 2. Pick screenshots

- **Visual change?** → Pick 1 screenshot that shows the result. The last one is usually the money shot.
- **No visual change?** → No screenshots. Don't force it.
- **Max 2 screenshots.** If you need more, the change is too complex for one report — split it.

### 3. Write the report

**Max 6 lines.** Language matches the project (Russian if Russian project).

Structure:
```
Что сделано (2-3 строки)
Где (ветка/коммит, одной строкой)
[Скрин: filename — что на нём, одной строкой]
Можно тестить.
```

### 4. Save

```bash
# Visual changes → folder with text + screenshot(s)
.git/reports/<task-name>/отчёт.txt
.git/reports/<task-name>/result.webp

# No visual → single file
.git/reports/<task-name>.txt
```

Print `file:///absolute/path` link at the end.

## Rules

- **No AI voice.** Write like a person, not a press release.
- **Don't repeat the task.** Client knows what they asked for.
- **Don't explain decisions.** Client doesn't care about your architecture.
- **One screenshot = the result.** Not the process, not every step.
- If the session had no git activity — just summarize what was discussed/decided.

## Anti-patterns

- ❌ 6 screenshots of every click
- ❌ 0 screenshots when the change is visual
- ❌ "В рамках поставленной задачи..."
- ❌ Bullet lists longer than 4 items
- ❌ Asking the user what to include — figure it out from session context
