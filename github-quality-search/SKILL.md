---
description: Search GitHub for high-quality libraries with strict quality filters (100+ stars, active maintenance, documentation)
---

# GitHub Quality Search Skill

Search GitHub for established, well-maintained libraries. Filters out low-quality repos automatically.

## Use this skill when:
- Looking for libraries to replace custom implementations
- Need alternatives to current dependencies
- Want established solutions for common problems (auth, HTTP, caching, etc.)
- Evaluating library quality before adoption

## Do NOT use this skill for:
- Finding specific projects you already know exist
- One-off code examples or gists
- Academic papers or research repos
- Your own private repositories

## Quality Filters (Applied Automatically)

**Minimum Bar:**
- 100+ stars
- Commit in last 6 months
- Has documentation (README with usage examples)
- Has releases (not just random commits)

**Red Flags (Auto-Excluded):**
- Archived repositories
- One-person projects with <5 contributors
- No CI/CD setup
- No license
- Stale issues (>50 open issues with no recent activity)

## Usage

```python
from skills.github_quality_search import search_github

results = search_github(
    query="jwt authentication python",
    language="python",
    min_stars=100,
    topics=["authentication", "jwt"],
    max_results=5
)

for repo in results:
    print(f"{repo['name']} - {repo['stars']}⭐ - {repo['description']}")
    print(f"  Health: {repo['health_score']}/100")
    print(f"  Last commit: {repo['last_commit']}")
    print(f"  License: {repo['license']}")
```

## Output Format

Each result includes:
- **name**: Full repo name (owner/repo)
- **description**: One-liner description
- **stars**: Star count
- **language**: Primary language
- **topics**: GitHub topics/tags
- **last_commit**: Days since last commit
- **license**: License type
- **health_score**: 0-100 (based on stars, activity, docs, CI)
- **url**: GitHub URL
- **docs_url**: Documentation URL (if exists)
- **weekly_commits**: Average commits per week (last 3 months)
- **contributor_count**: Total unique contributors

## Health Score Calculation

```
health_score = (
    stars_score * 0.3 +        # Popularity (log scale)
    activity_score * 0.3 +     # Recent commits, issue response time
    docs_score * 0.2 +         # README quality, wiki, docs site
    community_score * 0.2      # Contributors, CI setup, license
)
```

Scores 80+ = Excellent, 60-79 = Good, 40-59 = Okay, <40 = Risky

## Examples

### Replace custom retry logic
```python
results = search_github(
    query="http retry python",
    language="python",
    topics=["http-client", "retry"],
    min_stars=200
)
# Returns: requests, httpx, tenacity, backoff
```

### Replace custom JWT handling
```python
results = search_github(
    query="jwt token typescript",
    language="typescript",
    topics=["jwt", "authentication"],
    min_stars=500
)
# Returns: jsonwebtoken, jose, passport-jwt
```

### Replace custom validation
```python
results = search_github(
    query="data validation python",
    language="python",
    topics=["validation", "schema"],
    min_stars=1000
)
# Returns: pydantic, marshmallow, cerberus
```

## API Rate Limits

GitHub API: 60 requests/hour (unauthenticated), 5000/hour (authenticated)

To use authenticated access:
```bash
pass insert github/personal-access-token
# Paste your GitHub PAT (Settings → Developer settings → Personal access tokens)
```

Skill automatically uses PAT from `pass` if available.

## Dependencies

```bash
uv pip install requests python-dateutil
```

## Anti-Patterns to Avoid

❌ **Don't over-filter**: If no results, relax constraints (reduce min_stars)
❌ **Don't ignore health score**: 500⭐ abandoned repo < 200⭐ active repo
❌ **Don't skip license check**: MIT/Apache-2.0 = safe, GPL = viral, no license = risky
❌ **Don't cargo-cult**: Just because it's popular doesn't mean it fits your use case

✅ **Do compare alternatives**: Run search multiple times with different queries
✅ **Do check migration effort**: Look at API surface area, breaking changes
✅ **Do verify bundle size**: For frontend libs, check bundlephobia.com
✅ **Do read recent issues**: 100+ open issues = maintenance burden
