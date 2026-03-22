# browser-testing — Full ABP Browser Automation

Single CLI tool (`browser.js`) for complete [Agent Browser Protocol](https://github.com/theredsix/agent-browser-protocol) access. ABP is a Chromium fork with REST API baked into the engine — deterministic, no race conditions, ~100ms per action.

**30+ commands**: navigate, click, type, scroll, hover, drag, screenshot with element markup, text extraction, JS execution, tab management, dialog/download/file picker handling, execution control (freeze/resume JS), batch actions, session history.

```bash
browser.js start                    # Launch ABP
browser.js nav https://example.com  # Navigate
browser.js click 450 320            # Click
browser.js screenshot               # Screenshot with interactive markup
browser.js text                     # Extract visible text
browser.js key ENTER --mod CTRL     # Keyboard with modifiers
browser.js scroll 640 400 --dy 500  # Native wheel scroll
browser.js dialog accept            # Handle JS dialogs
browser.js batch '[{"type":"mouse_click","x":100,"y":200},{"type":"keyboard_type","text":"hi"}]'
```

Run `browser.js` without args for full command reference.
