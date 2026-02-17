---
name: hotspot-detective
description: Identify high-churn files ("hotspots") using git forensics. Frequently changed files often indicate complexity, technical debt, or violations of the Single Responsibility Principle.
---

# Hotspot Detective

"Code that changes together, breaks together." Find the most volatile parts of your codebase.

## Capabilities

- **Churn Analysis**: Identify files with the most commits.
- **Complexity-Churn Matrix**: Cross-reference hotspots with complexity.
- **Coupling Detection**: Find files that often change in the same commit.

## Tools

### 1. Find Top Hotspots (Churn)

Files changed most frequently in the last 6 months.

```bash
git log --since="6 months ago" --name-only --format="" | sort | uniq -c | sort -nr | head -20
```

**Interpretation:**
- Top files are your **"active complexity"**.
- If a file is in the top 5 AND has high complexity (from `uncomplex`), it is a **Critical Refactoring Candidate**.

### 2. Find Recent Volatility

What are we working on *right now*? (Last 30 days)

```bash
git log --since="30 days ago" --name-only --format="" | sort | uniq -c | sort -nr | head -20
```

### 3. Find Temporal Coupling (Co-Change)

"When I change A, I usually have to change B."

```bash
# Find commits touching a specific file, then list other files in those commits
git log --name-only --format="" $(git log --format="%H" -- <file>) | sort | uniq -c | sort -nr | head -10
```

**Usage:**
1. Identify a hotspot (e.g., `user_model.py`).
2. Run this command on `user_model.py`.
3. If `auth_service.py` appears at the top, they are **tightly coupled**.

## Workflow

1. **Scan**: Run "Find Top Hotspots".
2. **Cross-Ref**: Run `uncomplex` on the top 3 files.
3. **Diagnose**:
    - High Churn + High Complexity = **Refactor Immediately**.
    - High Churn + Low Complexity = **God Class / Config Dump**.
    - Low Churn + High Complexity = **Stable (Leave alone)**.

## Dependencies

- `git` (Pre-installed)
