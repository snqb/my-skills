---
name: code-review
description: On-demand code review for directories, git diffs, staged changes, or files. Manual invocation, structured feedback.
---

# Code Review Skill

## Default Behavior

**Review the last thing done in this conversation.**

No args needed. Just say `"review"` or `"review this"`.

If the context contains:
- Code just written/edited → review that
- Files just read → review those
- Diffs shown → review the diff
- Nothing obvious → ask what to review

---

## Explicit Targets (optional)

```
"review staged changes"              → git diff --cached
"review diff main..HEAD"             → git diff main...HEAD
"review src/auth/"                   → read & review dir
"review last 3 commits"              → git diff HEAD~3..HEAD
```

---

## Pyramid (Bottom = Most Important)

```
         ╱╲
        ╱  ╲   Style ← automate (ruff/eslint)
       ╱────╲
      ╱      ╲  Tests
     ╱────────╲
    ╱          ╲ Docs
   ╱────────────╲
  ╱              ╲ Implementation
 ╱────────────────╲
╱   API Design     ╲ ← FOCUS HERE
────────────────────
```

Source: [morling.dev/blog/the-code-review-pyramid](https://www.morling.dev/blog/the-code-review-pyramid/)

---

## Google Standard

> **Approve if it improves overall code health, even if not perfect.**

- No "perfect" code, only *better* code
- Don't block on nitpicks
- Balance progress vs. quality
- Prefix optional feedback with `Nit:`

Source: [google.github.io/eng-practices](https://google.github.io/eng-practices/review/reviewer/)

---

## What to Look For (Google)

| Area | Check |
|------|-------|
| **Design** | Does it belong here? Right abstraction? |
| **Functionality** | Works correctly? Edge cases? Concurrency? |
| **Complexity** | Can be understood quickly? Over-engineered? |
| **Tests** | Correct, sensible, useful? |
| **Naming** | Clear intent without being verbose? |
| **Comments** | Explain *why*, not *what*? |
| **Style** | Consistent? (delegate to linter) |

---

## Conventional Comments

Format: `label: subject`

| Label | Meaning |
|-------|---------|
| `praise:` | Highlight good stuff |
| `nitpick:` | Minor, non-blocking |
| `suggestion:` | Propose improvement |
| `issue:` | Problem that must be addressed |
| `question:` | Need clarification |
| `thought:` | Idea for consideration |
| `chore:` | Cleanup/maintenance task |

Decorations: `(blocking)`, `(non-blocking)`, `(security)`, `(performance)`

```
suggestion (security): This SQL uses string concat.
Use parameterized queries to prevent injection.
```

Source: [conventionalcomments.org](https://conventionalcomments.org/)

---

## Red Flags

### Security
- SQL string concat → injection
- `eval()`/`exec()` → RCE
- Hardcoded secrets
- Missing auth checks
- `pickle.load()` untrusted data

### Correctness
- Uncaught exceptions in I/O
- Race conditions
- Resource leaks (files, connections)
- Null/empty not handled
- Off-by-one

### Design
- God object (10+ methods)
- Boolean params (unclear at call site)
- Deep nesting (3+ levels)
- Copy-paste duplication

---

## Output Format

```markdown
## Review: <context>

### Summary
<1-2 sentences>

### Issues
**file:line** - `issue:`/`suggestion:`/`nitpick:`
<description>

### Good
<acknowledge quality>

### Questions
<clarifications needed>
```

---

## Tone

From Google eng-practices:

❌ "Why did **you** do this?"
✅ "This approach adds complexity without benefit because..."

- Comment on *code*, not *developer*
- Explain *why*
- Offer alternatives
- Acknowledge good work

---

## Automate First

Run before reviewing:

```bash
ruff check .                         # Python
eslint .                             # JS/TS
go vet ./... && staticcheck ./...    # Go
cargo clippy                         # Rust
```

Don't waste review time on what tools catch.

---

## References

- [Google Eng Practices](https://google.github.io/eng-practices/review/reviewer/)
- [Code Review Pyramid](https://www.morling.dev/blog/the-code-review-pyramid/)
- [Conventional Comments](https://conventionalcomments.org/)
- [How to Make Your Reviewer Fall in Love](https://mtlynch.io/code-review-love/)
- [awesome-code-review](https://github.com/joho/awesome-code-review)
