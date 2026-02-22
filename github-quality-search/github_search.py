#!/usr/bin/env python3
"""
GitHub Quality Search - Find high-quality libraries with strict filters
"""

import json
import subprocess
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from urllib.parse import urlencode
import math

try:
    import requests
    from dateutil import parser as dateparser
except ImportError:
    print("Installing dependencies: requests python-dateutil", file=sys.stderr)
    subprocess.run(["uv", "pip", "install", "requests", "python-dateutil"], check=True)
    import requests
    from dateutil import parser as dateparser


def get_github_token() -> Optional[str]:
    """Try to get GitHub token from pass"""
    try:
        result = subprocess.run(
            ["pass", "show", "github/personal-access-token"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None


def calculate_health_score(repo_data: Dict, contributors: int, weekly_commits: float) -> int:
    """Calculate health score 0-100 based on multiple signals"""

    # Stars score (log scale, 100 stars = 50, 10k stars = 100)
    stars = repo_data.get('stargazers_count', 0)
    stars_score = min(100, (math.log10(max(1, stars)) / 4) * 100)

    # Activity score (recent commits, last push)
    last_push = dateparser.parse(repo_data['pushed_at'])
    now = datetime.now(last_push.tzinfo) if last_push.tzinfo else datetime.now()
    days_since_push = (now - last_push).days
    activity_score = max(0, 100 - (days_since_push / 30) * 50)  # Decay over 60 days
    activity_score += min(50, weekly_commits * 5)  # Bonus for active development
    activity_score = min(100, activity_score)

    # Docs score
    has_readme = repo_data.get('size', 0) > 0  # Proxy for README
    has_wiki = repo_data.get('has_wiki', False)
    has_pages = repo_data.get('has_pages', False)
    docs_score = (has_readme * 40) + (has_wiki * 30) + (has_pages * 30)

    # Community score
    has_license = repo_data.get('license') is not None
    contributor_score = min(100, (contributors / 10) * 100)  # 10+ contributors = max
    community_score = (has_license * 50) + (contributor_score * 0.5)

    # Weighted average
    health = (
        stars_score * 0.3 +
        activity_score * 0.3 +
        docs_score * 0.2 +
        community_score * 0.2
    )

    return int(health)


def get_repo_details(repo_full_name: str, token: Optional[str]) -> Dict:
    """Get additional repo details (contributors, commit activity)"""
    headers = {"Authorization": f"token {token}"} if token else {}

    # Get contributors count
    try:
        resp = requests.get(
            f"https://api.github.com/repos/{repo_full_name}/contributors",
            headers=headers,
            params={"per_page": 1, "anon": "true"},
            timeout=10
        )
        # GitHub returns total count in Link header
        contributors = 1
        if 'Link' in resp.headers:
            # Parse last page number from Link header
            link = resp.headers['Link']
            if 'page=' in link:
                import re
                match = re.search(r'page=(\d+)>; rel="last"', link)
                if match:
                    contributors = int(match.group(1))
        elif resp.status_code == 200:
            contributors = len(resp.json())
    except Exception:
        contributors = 1

    # Get commit activity (last 3 months)
    try:
        resp = requests.get(
            f"https://api.github.com/repos/{repo_full_name}/stats/participation",
            headers=headers,
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            # Last 12 weeks of commit activity
            recent_commits = data.get('all', [])[-12:]
            weekly_commits = sum(recent_commits) / len(recent_commits) if recent_commits else 0
        else:
            weekly_commits = 0
    except Exception:
        weekly_commits = 0

    return {
        "contributor_count": contributors,
        "weekly_commits": round(weekly_commits, 1)
    }


def search_github(
    query: str,
    language: Optional[str] = None,
    min_stars: int = 100,
    topics: Optional[List[str]] = None,
    max_results: int = 5,
    include_details: bool = True
) -> List[Dict]:
    """
    Search GitHub for high-quality repositories

    Args:
        query: Search query (e.g., "jwt authentication")
        language: Filter by language (python, typescript, etc.)
        min_stars: Minimum star count (default: 100)
        topics: GitHub topics to filter by (e.g., ["jwt", "authentication"])
        max_results: Maximum results to return (default: 5)
        include_details: Fetch detailed stats (slower but more accurate health scores)

    Returns:
        List of repository dictionaries with health scores
    """

    token = get_github_token()
    headers = {"Authorization": f"token {token}"} if token else {}

    # Build search query
    search_parts = [query]
    search_parts.append(f"stars:>={min_stars}")

    if language:
        search_parts.append(f"language:{language}")

    if topics:
        for topic in topics:
            search_parts.append(f"topic:{topic}")

    # Exclude archived repos
    search_parts.append("archived:false")

    # Filter by recent activity (pushed in last 6 months)
    six_months_ago = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
    search_parts.append(f"pushed:>={six_months_ago}")

    search_query = " ".join(search_parts)

    # Make API request
    try:
        resp = requests.get(
            "https://api.github.com/search/repositories",
            headers=headers,
            params={
                "q": search_query,
                "sort": "stars",
                "order": "desc",
                "per_page": max_results
            },
            timeout=15
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        print(f"❌ GitHub API error: {e}", file=sys.stderr)
        return []

    results = []
    for item in data.get('items', [])[:max_results]:
        # Calculate days since last commit
        last_push = dateparser.parse(item['pushed_at'])
        # Make datetime.now() timezone-aware to match GitHub's timestamps
        now = datetime.now(last_push.tzinfo) if last_push.tzinfo else datetime.now()
        days_since_push = (now - last_push).days

        # Get detailed stats if requested
        if include_details:
            details = get_repo_details(item['full_name'], token)
        else:
            details = {"contributor_count": 0, "weekly_commits": 0}

        # Extract license
        license_info = item.get('license')
        license_name = license_info['spdx_id'] if license_info else None

        # Build result
        repo = {
            "name": item['full_name'],
            "description": item['description'] or "No description",
            "stars": item['stargazers_count'],
            "language": item['language'] or "Unknown",
            "topics": item.get('topics', []),
            "last_commit_days": days_since_push,
            "license": license_name,
            "url": item['html_url'],
            "docs_url": item.get('homepage') or f"{item['html_url']}/wiki",
            "contributor_count": details['contributor_count'],
            "weekly_commits": details['weekly_commits'],
        }

        # Calculate health score
        repo['health_score'] = calculate_health_score(
            item,
            details['contributor_count'],
            details['weekly_commits']
        )

        results.append(repo)

    # Sort by health score (descending)
    results.sort(key=lambda x: x['health_score'], reverse=True)

    return results


def main():
    """CLI interface"""
    import argparse

    parser = argparse.ArgumentParser(description="Search GitHub for high-quality libraries")
    parser.add_argument("query", help="Search query")
    parser.add_argument("-l", "--language", help="Filter by language")
    parser.add_argument("-s", "--min-stars", type=int, default=100, help="Minimum stars")
    parser.add_argument("-t", "--topics", nargs="+", help="GitHub topics")
    parser.add_argument("-n", "--max-results", type=int, default=5, help="Max results")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument("--no-details", action="store_true", help="Skip detailed stats (faster)")

    args = parser.parse_args()

    results = search_github(
        query=args.query,
        language=args.language,
        min_stars=args.min_stars,
        topics=args.topics,
        max_results=args.max_results,
        include_details=not args.no_details
    )

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        if not results:
            print("No results found. Try relaxing constraints (lower --min-stars)")
            return

        print(f"\n🔍 Found {len(results)} high-quality libraries:\n")
        for i, repo in enumerate(results, 1):
            health_emoji = "🟢" if repo['health_score'] >= 80 else "🟡" if repo['health_score'] >= 60 else "🔴"
            print(f"{i}. {repo['name']} ({repo['stars']}⭐)")
            print(f"   {repo['description'][:80]}...")
            print(f"   {health_emoji} Health: {repo['health_score']}/100 | License: {repo['license']} | Last commit: {repo['last_commit_days']}d ago")
            print(f"   {repo['url']}")
            if repo['contributor_count']:
                print(f"   Contributors: {repo['contributor_count']} | Commits/week: {repo['weekly_commits']}")
            print()


if __name__ == "__main__":
    main()
