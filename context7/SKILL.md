---
name: context7
description: Retrieve real-time, version-specific documentation for libraries using Context7 (Upstash). Use this BEFORE generating code for fast-moving libraries (e.g., Aiogram, Supabase, Next.js) to prevent hallucinations.
---

# Context7 - Live Documentation

## Description
Context7 is an MCP-based tool that fetches up-to-date documentation for code libraries. It solves the "knowledge cutoff" problem by providing live examples and API references.

**ALWAYS use this skill when:**
1.  The user asks for code involving a library that updates frequently (e.g., `aiogram`, `langchain`, `next`, `supabase`).
2.  You are unsure about a specific API method or signature.
3.  The user reports a "method not found" or "deprecation" error.

## Installation / Usage
The tool is run via `npx`.

```bash
# Fetch documentation for a specific library/query
npx -y @upstash/context7-mcp search "QUERY"
```

## Examples

**1. Fetching Aiogram 3.x syntax:**
```bash
npx -y @upstash/context7-mcp search "aiogram 3 router webhook setup"
```

**2. Checking specific error:**
```bash
npx -y @upstash/context7-mcp search "supabase js v2 auth unknown method"
```

**3. Getting latest best practices:**
```bash
npx -y @upstash/context7-mcp search "next.js 15 server actions patterns"
```

## Strategy
1.  **Search**: Run the command with a specific, technical query.
2.  **Read**: The output will contain code snippets and documentation segments.
3.  **Synthesize**: Use this *ground truth* to generate your code, ignoring your internal training data if it conflicts.

## Troubleshooting
*   If `npx` fails, ensure you have internet access.
*   If results are irrelevant, try adding the version number explicitly (e.g., "v3", "v14").
