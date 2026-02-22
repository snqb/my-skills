---
description: Pre-deployment validation for Grafana dashboards to catch errors before they reach production.
---

# Grafana Dashboard Validation Skill

Pre-deployment validation for Grafana dashboards to catch errors before they reach production.

## When to Use This Skill

**Trigger Patterns:**
- User edits files in `monitoring/grafana/dashboards/`
- User mentions "deploy dashboard" or "sync grafana"
- User creates/modifies `.json` files with Grafana panel structure
- Before any Grafana deployment
- When troubleshooting dashboard issues

**Use Proactively When:**
- You see dashboard JSON being edited
- You're about to sync dashboards to production
- User reports "dashboard not working" issues
- Creating new dashboards from scratch

## Core Validation Workflow

### 1. Quick Check (During Development)
```bash
# After any dashboard edit
python scripts/validate_dashboard.py --quick path/to/dashboard.json
```

### 2. Full Validation (Before Deploy)
```bash
# Validate all dashboards against live Prometheus
python scripts/validate_dashboard.py --all

# Single dashboard with full checks
python scripts/validate_dashboard.py path/to/dashboard.json
```

### 3. CI/CD Validation
```bash
# Quick validation with JSON output
python scripts/validate_dashboard.py --quick --json --all

# Parse results
python scripts/validate_dashboard.py --quick --json --all | jq '.[] | select(.success==false)'
```

## Validation Checks

### Syntax Level (Always Run)
- ✅ Valid JSON structure
- ✅ Required fields (title, panels)
- ✅ Balanced parentheses/brackets in queries
- ✅ Panel type validity
- ✅ Datasource UID presence

### Runtime Level (Full Mode Only)
- ✅ PromQL queries execute successfully
- ✅ Metrics exist in Prometheus
- ✅ Queries return data (warning if empty)
- ✅ Variable queries are valid
- ✅ SQL syntax is valid

### What's NOT Validated
- ❌ Visual appearance
- ❌ Panel layout/positioning
- ❌ User permissions
- ❌ Plugin availability

## Implementation Pattern

### For New Projects

1. **Copy validation script:**
```bash
# Copy from this skill to project
cp ~/.claude/skills/grafana-dashboard-validation/validate_dashboard.py scripts/

# Or download latest version
curl -o scripts/validate_dashboard.py \
  https://raw.githubusercontent.com/YOUR_ORG/grafana-tools/main/validate_dashboard.py
```

2. **Create sync script with validation:**
```bash
#!/bin/bash
# scripts/sync_grafana.sh

# Always validate first
python scripts/validate_dashboard.py --all || {
  echo "❌ Validation failed. Fix errors or use --force to override"
  exit 1
}

# Then sync
rsync -av monitoring/grafana/ user@server:/path/to/grafana/
```

3. **Add pre-commit hook:**
```bash
# .git/hooks/pre-commit
if git diff --cached --name-only | grep -q "dashboards.*\.json"; then
  python scripts/validate_dashboard.py --quick --all || exit 1
fi
```

### For Existing Projects

Check if validation exists:
```bash
# Look for validator
ls -la scripts/validate_dashboard.py 2>/dev/null || echo "No validator found"

# If missing, add it
if [ ! -f scripts/validate_dashboard.py ]; then
  echo "📝 Adding dashboard validator to project..."
  cp ~/.claude/skills/grafana-dashboard-validation/validate_dashboard.py scripts/
fi
```

## Common Issues and Fixes

### Issue: "Metric not found"
```python
# Check if metric exists
curl -s http://prometheus:9090/api/v1/label/__name__/values | jq '.data[] | select(contains("your_metric"))'

# Common causes:
# 1. Metric not yet created (deploy app first)
# 2. Wrong metric name (check spelling)
# 3. Prometheus not scraping (check targets)
```

### Issue: "Query returns no data"
```python
# Test query directly
curl -g 'http://prometheus:9090/api/v1/query?query=your_promql_here'

# Common causes:
# 1. No data in time range (normal for new deploy)
# 2. Wrong label filters
# 3. Missing service
```

### Issue: "Invalid PromQL"
```python
# Validate syntax
promtool check query "your_promql_here"

# Common issues:
# 1. Unbalanced parentheses
# 2. Invalid function names
# 3. Wrong aggregation syntax
```

## Error Severity Guide

**Must Fix (Errors):**
- Invalid JSON - Dashboard won't load
- Invalid PromQL syntax - Panel will error
- Missing datasource UID - Panel can't query

**Should Fix (Warnings):**
- Metric doesn't exist - Panel will be empty
- Query returns no data - Might be normal
- Hardcoded dates in SQL - Will become stale

**Informational:**
- Template variables - Can't fully validate
- Hidden queries - Might be intentional
- Non-standard UIDs - Still works

## Integration Examples

### GitHub Actions
```yaml
name: Validate Dashboards
on:
  pull_request:
    paths:
      - 'monitoring/grafana/dashboards/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
      - run: pip install requests
      - run: python scripts/validate_dashboard.py --quick --json --all
```

### GitLab CI
```yaml
validate-dashboards:
  stage: test
  script:
    - python scripts/validate_dashboard.py --quick --all
  only:
    changes:
      - monitoring/grafana/dashboards/**
```

### Pre-push Enforcement
```bash
# .git/hooks/pre-push
#!/bin/bash
if git diff --name-only origin/main HEAD | grep -q "dashboards.*\.json"; then
  echo "Validating dashboards before push..."
  python scripts/validate_dashboard.py --all || {
    echo "Push blocked: Dashboard validation failed"
    exit 1
  }
fi
```

## Proactive Patterns for Claude

### When User Edits Dashboard
```python
# After editing any dashboard.json
print("I'll validate that dashboard to catch any issues...")
subprocess.run(["python", "scripts/validate_dashboard.py", "--quick", "path/to/dashboard.json"])
```

### Before Deployment
```python
# Always run before sync
print("Let me validate all dashboards before deploying...")
result = subprocess.run(["python", "scripts/validate_dashboard.py", "--all"])
if result.returncode != 0:
    print("Found issues - let me help fix them...")
```

### When Creating New Dashboard
```python
# After generating dashboard JSON
with open("new_dashboard.json", "w") as f:
    json.dump(dashboard_config, f, indent=2)

# Immediately validate
print("Validating the generated dashboard...")
subprocess.run(["python", "scripts/validate_dashboard.py", "--quick", "new_dashboard.json"])
```

## Performance Considerations

- **Quick mode**: <1 second (no network)
- **Full mode**: 2-10 seconds (depends on query count)
- **All dashboards**: Multiply by dashboard count

For large deployments (>50 dashboards), use quick mode in CI and full mode manually.

## Skill Dependencies

Required Python packages:
- `requests` (for Prometheus API)
- `json` (standard library)
- `pathlib` (standard library)
- `argparse` (standard library)

No external tools required for quick mode.

## Summary

This skill provides fail-fast feedback for Grafana dashboards:
1. **Catches 80% of issues** before deployment
2. **Two modes** for different scenarios
3. **CI/CD ready** with JSON output
4. **Proactive validation** during development

Always validate before deploying. The 30 seconds spent validating saves hours of debugging broken dashboards in production.