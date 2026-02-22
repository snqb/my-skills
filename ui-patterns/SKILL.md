---
name: ui-patterns
description: "Research real-world UI patterns from curated galleries (Collect UI, Component Gallery, Mobbin). Use when exploring what exists: dropdowns, accordions, inputs, navigation, cards, modals, etc."
---

# UI Patterns Research

Research real-world UI component implementations before designing.

## Usage Modes

**Mode 1: Agent opens URLs for user**
```bash
open "https://collectui.com/challenges/dropdown"
```
→ User reviews in browser, describes what they like
→ Agent synthesizes feedback into design direction

**Mode 2: Agent uses browser-testing skill** (if available)
```
# Use browser-testing skill to screenshot/analyze
# See: skills/browser-testing/SKILL.md
```
→ Agent can visually analyze patterns directly

**Mode 3: Agent uses knowledge + URLs as reference**
→ Agent describes known patterns from training
→ Provides URLs for user to verify/explore

## When to Use

- "What kinds of dropdowns exist?"
- "Show me accordion patterns"
- "How do real apps handle onboarding?"
- Exploring options before implementing
- Need visual references for a component

## Sources

| Source | Best For | URL |
|--------|----------|-----|
| **Collect UI** | Visual variations, creative treatments | collectui.com |
| **Component Gallery** | Design system comparisons | component.gallery |
| **Mobbin** | Real app screenshots, flows | mobbin.com |

## Quick Lookup

```bash
# Collect UI - visual inspiration (use /challenges/{component})
open "https://collectui.com/challenges/dropdown"
open "https://collectui.com/challenges/accordion"
open "https://collectui.com/challenges/toggle"
open "https://collectui.com/challenges/modal"
open "https://collectui.com/challenges/search"

# Component Gallery - design system implementations
open "https://component.gallery/components/accordion/"
open "https://component.gallery/components/button/"
open "https://component.gallery/components/dropdown/"
open "https://component.gallery/components/modal/"
open "https://component.gallery/components/tabs/"

# Mobbin - real apps by platform
open "https://mobbin.com/browse/web/apps"
open "https://mobbin.com/browse/ios/apps"
open "https://mobbin.com/browse/android/apps"
```

## Available Components

**Collect UI**: accordion, alert, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, comment, countdown, credit-card, dashboard, datepicker, dropdown, empty-state, error, faq, file-upload, footer, form, gallery, header, hero, icon, input, invoice, list, loading, login, map, menu, modal, music-player, navigation, notification, onboarding, pagination, player, popup, pricing, product, profile, progress, radio, receipt, search, select, settings, share, sidebar, signup, slider, social, stats, stepper, table, tabs, tag, testimonial, timeline, timer, toast, toggle, tooltip, user-profile, video, weather, widget

**Component Gallery**: accordion, alert, avatar, badge, breadcrumb, button, card, checkbox, dialog, disclosure, dropdown, icon, input, link, list, menu, modal, pagination, popover, progress, radio, select, skeleton, slider, spinner, switch, table, tabs, tag, textarea, toast, toggle, tooltip, tree

## Workflow

```
1. IDENTIFY    → What component? (e.g., "dropdown for settings")
2. OPEN URLS   → Check all 3 sources (bash: open "url")
3. OBSERVE     → Note variations, patterns, accessibility approaches
4. SYNTHESIZE  → Pick direction: "Notion's command palette + Linear's minimal chrome"
5. IMPLEMENT   → Use ui-design (principles) + frontend-design (execution)
```

## Output Template

After researching, document findings:

```markdown
## Pattern Research: {Component}

### Visual Variations (Collect UI)
- Style A: {description}
- Style B: {description}
- Notable: {interesting approach}

### Production Patterns (Component Gallery)
- {Design System}: {approach, e.g., "uses portals, keyboard nav"}
- {Design System}: {approach}
- Accessibility: {common a11y patterns}

### Real-World Context (Mobbin)
- {App}: {how they use it}
- {App}: {how they use it}

### Synthesis
Direction: "{combine insights into design direction}"
Key decisions: {what to adopt, what to avoid}
```

## Example: Dropdown Research

```markdown
## Pattern Research: Dropdown

### Visual Variations (Collect UI)
- Glassmorphic: blur background, subtle borders
- Minimal: no borders, shadow only, tight spacing
- Rich: icons + descriptions + keyboard hints

### Production Patterns (Component Gallery)
- Radix: portal-based, collision detection, full keyboard
- Chakra: popper.js, focus trap, typeahead search
- Accessibility: arrow keys, escape close, focus management

### Real-World Context (Mobbin)
- Notion: command palette style, search-first
- Linear: ultra-minimal, fast, keyboard-driven
- Figma: nested menus, icon-heavy, contextual

### Synthesis
Direction: "Notion's searchable command palette + Linear's minimal chrome"
Key decisions: Include search, skip nested menus, keyboard-first
```

## Related Skills

| Skill | When | Purpose |
|-------|------|---------|
| **`ui-design`** | After research | Apply composition, colors, typography |
| **`frontend-design`** | Implementation | Execute with distinctive aesthetics |
| **`shadcn-ui`** | Implementation | Accessible component foundations |

**Workflow**: `ui-patterns` → `ui-design` → `frontend-design`

## Anti-Patterns

| ❌ Don't | ✅ Do |
|---------|------|
| Copy first result | Compare 3+ sources |
| Skip accessibility notes | Study Component Gallery's a11y |
| Ignore platform conventions | Match user expectations (iOS/Android/Web) |
| Research without documenting | Use output template above |
