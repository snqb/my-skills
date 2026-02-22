---
name: dead-code-reaper
description: Detect unused functions, classes, and variables. Uses Vulture (Python) and ts-prune (JS/TS) to find candidates, then relies on Agent verification to avoid false positives.
---

# Dead Code Reaper

Find code that does nothing. Less code = Less complexity.

## Capabilities

- **Python**: Uses `vulture` to find unused code.
- **JS/TS**: Uses `ts-prune` to find unused exports.
- **Verification**: Forces an agentic "Double Check" before reporting.

## Tools

### 1. Scan Python

Finds unused code candidates in Python files.

```bash
# Install if missing
pip install vulture > /dev/null 2>&1

# Run scan (exclude tests and migrations by default)
vulture . --min-confidence 80 --exclude "tests/,migrations/,venv/,.venv/"
```

**Output Interpretation:**
- `unused function 'foo'`
- `unused class 'Bar'`
- **Action**: Treat these as *suspects*.

### 2. Scan TypeScript/JavaScript

Finds unused exports in TS/JS projects.

```bash
# Run with bunx (instant, no install needed)
bunx ts-prune | head -n 50
```

## Workflow (The "Reaper Protocol")

**1. Detect Suspects**
Run the scan tool for the language.

**2. Verify (The "Double Check")**
Static analysis is often wrong (false positives). Before declaring code "dead," check for dynamic usage:
- **String References**: Search for the name in quotes (e.g., `getattr(x, "my_func")`).
- **Framework Magic**: Is it a Django view? A Pytest fixture? An API route? (These are often "unused" but vital).
- **Entry Points**: Is it `main.py` or `cli.py`?

**3. Report**
Present the list of *verified* dead code.

```markdown
## Dead Code Candidates

| File | Symbol | Confidence | Recommendation |
|------|--------|------------|----------------|
| `utils.py` | `old_helper` | High | 🗑️ Delete |
| `api.py` | `unused_handler` | Medium | ⚠️ Check URL conf |
```

## Anti-Patterns

❌ **Deleting without checking**: Vulture is heuristic. It *will* be wrong.
❌ **Ignoring API surfaces**: Public libraries have "unused" functions that are meant for users.
❌ **Removing "TODO" stubs**: Empty functions might be placeholders.

## Dependencies

- Python: `vulture`
- Node: `ts-prune` (via `npx`)
