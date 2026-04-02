---
name: share-md
description: "Share Markdown files as public web pages via rentry.co. Paste MD → get URL. Use when asked to 'share', 'publish', 'send link' for any .md file or report."
---

# share-md

Share Markdown as a public web page via rentry.co (FOSS, no tracking, no account).

## Tool

`~/.pi/agent/skills/share-md/share.ts`

## Usage

```bash
# Share a file
~/.pi/agent/skills/share-md/share.ts report.md

# Share with custom slug
~/.pi/agent/skills/share-md/share.ts report.md --slug my-report

# Update existing
~/.pi/agent/skills/share-md/share.ts report.md --slug my-report --edit-code SECRET
```

Output: URL to the published page.

## How it works

1. GET rentry.co to obtain CSRF token + cookies
2. POST to /api/new with token, text, optional slug and edit_code
3. Returns public URL

Edit codes are saved to `~/.local/share/share-md/codes.json` for future updates.
