# browser-testing — Full ABP Browser Automation

Single CLI tool (`browser.js`) for complete [Agent Browser Protocol](https://github.com/theredsix/agent-browser-protocol) access. ABP is a Chromium fork with REST API baked into the engine — deterministic, no race conditions, ~100ms per action.

## Smart Commands (token-efficient)

```bash
browser.js observe                           # Structured page snapshot (~150 tokens)
browser.js observe "form"                    # Scoped to CSS selector (~50 tokens)
browser.js assert text "Welcome back"        # Pass/fail check (~20 tokens)
browser.js assert selector "#dashboard"      # Element exists?
browser.js watch --text "Done" --timeout 30s # Wait for async UI, no polling loop
```

`observe` returns URL, title, scroll position, visible inputs/buttons/headings/errors as structured text — enough to decide next action without a screenshot.

## Core Commands

```bash
browser.js start                    # Launch ABP (auto-port per project)
browser.js nav https://example.com  # Navigate
browser.js click 450 320            # Click
browser.js type hello               # Type text
browser.js key ENTER --mod CTRL     # Keyboard with modifiers
browser.js screenshot               # Screenshot with interactive markup
browser.js text                     # Extract visible text
browser.js eval 'document.title'    # Execute JavaScript
browser.js content                  # Page as Markdown (Readability)
browser.js scroll 640 400 --dy 500  # Native wheel scroll
browser.js dialog accept            # Handle JS dialogs
browser.js batch '[...]'            # Multiple actions, one call
```

30+ commands total: mouse, keyboard, tabs, downloads, file pickers, permissions, console capture, execution control, session history. Run `browser.js` without args for full reference.

## Context Compactor

`~/.pi/agent/extensions/browser-context-compactor.ts` — strips screenshot images from tool results older than 5 turns. Keeps context lean during long browser sessions.
