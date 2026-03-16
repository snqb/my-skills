#!/usr/bin/env -S deno run --allow-all
/** GitHub Quality Search — find high-quality libraries with strict filters. */
import $ from "jsr:@david/dax@0.44.2";
import { parseArgs } from "jsr:@std/cli";
import { sortBy } from "jsr:@std/collections";

// --- types ---

interface Repo {
  name: string;
  description: string;
  stars: number;
  language: string;
  topics: string[];
  last_commit_days: number;
  license: string | null;
  url: string;
  docs_url: string;
  contributor_count: number;
  weekly_commits: number;
  health_score: number;
}

// --- github token ---

async function getToken(): Promise<string | undefined> {
  try {
    return (await $`pass show github/personal-access-token`.noThrow()).stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

function headers(token?: string): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/json" };
  if (token) h.Authorization = `token ${token}`;
  return h;
}

// --- health score ---

function healthScore(repo: Record<string, unknown>, contributors: number, weeklyCommits: number): number {
  const stars = (repo.stargazers_count as number) || 0;
  const starsScore = Math.min(100, (Math.log10(Math.max(1, stars)) / 4) * 100);

  const pushedAt = new Date(repo.pushed_at as string);
  const daysSincePush = (Date.now() - pushedAt.getTime()) / 86400_000;
  let activityScore = Math.max(0, 100 - (daysSincePush / 30) * 50);
  activityScore += Math.min(50, weeklyCommits * 5);
  activityScore = Math.min(100, activityScore);

  const docsScore = ((repo.size as number) > 0 ? 40 : 0)
    + ((repo.has_wiki as boolean) ? 30 : 0)
    + ((repo.has_pages as boolean) ? 30 : 0);

  const hasLicense = repo.license != null;
  const contribScore = Math.min(100, (contributors / 10) * 100);
  const communityScore = (hasLicense ? 50 : 0) + contribScore * 0.5;

  return Math.round(starsScore * 0.3 + activityScore * 0.3 + docsScore * 0.2 + communityScore * 0.2);
}

// --- repo details ---

async function getRepoDetails(fullName: string, token?: string): Promise<{ contributors: number; weeklyCommits: number }> {
  const h = headers(token);

  let contributors = 1;
  try {
    const resp = await fetch(`https://api.github.com/repos/${fullName}/contributors?per_page=1&anon=true`, { headers: h });
    const link = resp.headers.get("Link") ?? "";
    const match = link.match(/page=(\d+)>; rel="last"/);
    contributors = match ? Number(match[1]) : (await resp.json()).length ?? 1;
  } catch { /* */ }

  let weeklyCommits = 0;
  try {
    const resp = await fetch(`https://api.github.com/repos/${fullName}/stats/participation`, { headers: h });
    if (resp.ok) {
      const data = await resp.json();
      const recent = (data.all as number[]).slice(-12);
      weeklyCommits = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    }
  } catch { /* */ }

  return { contributors, weeklyCommits: Math.round(weeklyCommits * 10) / 10 };
}

// --- search ---

async function search(opts: {
  query: string;
  language?: string;
  minStars: number;
  topics?: string[];
  maxResults: number;
  details: boolean;
}): Promise<Repo[]> {
  const token = await getToken();
  const h = headers(token);

  const parts = [opts.query, `stars:>=${opts.minStars}`, "archived:false"];
  if (opts.language) parts.push(`language:${opts.language}`);
  for (const t of opts.topics ?? []) parts.push(`topic:${t}`);

  const sixMonthsAgo = new Date(Date.now() - 180 * 86400_000).toISOString().slice(0, 10);
  parts.push(`pushed:>=${sixMonthsAgo}`);

  const q = parts.join(" ");
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${opts.maxResults}`;

  const resp = await fetch(url, { headers: h });
  if (!resp.ok) {
    console.error(`❌ GitHub API error: ${resp.status} ${resp.statusText}`);
    return [];
  }
  const data = await resp.json();

  const results: Repo[] = [];
  for (const item of (data.items ?? []).slice(0, opts.maxResults)) {
    const daysSincePush = Math.round((Date.now() - new Date(item.pushed_at).getTime()) / 86400_000);
    const details = opts.details ? await getRepoDetails(item.full_name, token) : { contributors: 0, weeklyCommits: 0 };
    const license = item.license?.spdx_id ?? null;

    results.push({
      name: item.full_name,
      description: item.description ?? "No description",
      stars: item.stargazers_count,
      language: item.language ?? "Unknown",
      topics: item.topics ?? [],
      last_commit_days: daysSincePush,
      license,
      url: item.html_url,
      docs_url: item.homepage || `${item.html_url}/wiki`,
      contributor_count: details.contributors,
      weekly_commits: details.weeklyCommits,
      health_score: healthScore(item, details.contributors, details.weeklyCommits),
    });
  }

  return sortBy(results, (r) => -r.health_score);
}

// --- CLI ---

const args = parseArgs(Deno.args, {
  string: ["language", "min-stars", "topics", "max-results"],
  boolean: ["json", "no-details", "help"],
  alias: { l: "language", s: "min-stars", t: "topics", n: "max-results", h: "help" },
  default: { "min-stars": "100", "max-results": "5" },
});

if (args.help || args._.length === 0) {
  console.log(`Usage: github_search.ts <query> [options]

Options:
  -l, --language LANG    Filter by language
  -s, --min-stars N      Minimum stars (default: 100)
  -t, --topics T1,T2     GitHub topics (comma-separated)
  -n, --max-results N    Max results (default: 5)
  --json                 Output JSON
  --no-details           Skip contributor/commit stats (faster)`);
  Deno.exit(0);
}

const results = await search({
  query: String(args._[0]),
  language: args.language,
  minStars: Number(args["min-stars"]),
  topics: args.topics?.split(","),
  maxResults: Number(args["max-results"]),
  details: !args["no-details"],
});

if (args.json) {
  console.log(JSON.stringify(results, null, 2));
} else {
  if (!results.length) {
    console.log("No results found. Try relaxing constraints (lower --min-stars)");
    Deno.exit(0);
  }

  console.log(`\n🔍 Found ${results.length} high-quality libraries:\n`);
  for (const [i, r] of results.entries()) {
    const emoji = r.health_score >= 80 ? "🟢" : r.health_score >= 60 ? "🟡" : "🔴";
    console.log(`${i + 1}. ${r.name} (${r.stars}⭐)`);
    console.log(`   ${r.description.slice(0, 80)}...`);
    console.log(`   ${emoji} Health: ${r.health_score}/100 | License: ${r.license} | Last commit: ${r.last_commit_days}d ago`);
    console.log(`   ${r.url}`);
    if (r.contributor_count) {
      console.log(`   Contributors: ${r.contributor_count} | Commits/week: ${r.weekly_commits}`);
    }
    console.log();
  }
}
