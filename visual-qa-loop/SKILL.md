---
name: visual-qa-loop
description: "Structured visual QA: screenshot → batch issues → fix all → verify. Replaces the 300-cycle screenshot→edit death spiral. Optional bishkek review as exit gate. Use when building/polishing UI with browser testing, or when user asks for N iterations/reviews."
---

# Visual QA Loop

Prevents the screenshot→fix→screenshot→fix death spiral (300+ cycles seen in real sessions).

## Protocol

### 1. Audit First (no edits)

Screenshot **every view** before touching code. Desktop + mobile. Light + dark. Empty + populated. All major routes.

Look at ALL screenshots. Write one issue list:

```markdown
### P0 — Broken
- [ ] Login button does nothing (home, mobile)

### P1 — Significant  
- [ ] Cards truncated (search, desktop)

### P2 — Polish
- [ ] Spacing inconsistent (search, mobile)
```

### 2. Batch Fix

Fix **all issues** before taking another screenshot. Group by file — one edit per file per round, not per issue.

**>5 edits to the same file = stop and refactor it.** You're patching a monolith. Split the component first, then fix.

### 3. Verify

Re-screenshot same views. Check off fixed issues. If regressions appeared, add to list and do one more batch.

### 4. Exit Gate

**Max 3 rounds.** If round 4 is needed, the architecture is wrong — refactor, don't patch.

When the list is mostly ✅, optionally run `bishkek-report` as final QA. One review → one batch fix → done. Not review→fix→review→fix.

## Rules

- **Audit before edit** — finish looking before touching code
- **Mobile + desktop together** — not "desktop first, then mobile later"
- **State exit criteria upfront** — "these N flows pass on desktop + mobile = done"
- **"Do 10 rounds" → do 3 structured ones** — propose concrete scope, not open-ended iteration
- **Bishkek at end, not during** — exit gate, not mid-loop diagnostic
