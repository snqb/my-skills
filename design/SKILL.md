---
name: design
description: "Unified design hub — routes to the right sub-skill for any visual/UI/UX task. Covers: component sourcing, aesthetics, composition, patterns, mobile, photos, canvas art, shadcn. Load this when doing any design work."
---

# Design — Unified Routing Hub

One skill to load for any visual work. Routes to specialized sub-skills by task type.

## Route Table

| You're doing... | Load this skill | Path |
|-----------------|----------------|------|
| **Sourcing components** (21st.dev, Magic UI, Aceternity) | `component-craft` | `~/.pi/agent/skills/component-craft/SKILL.md` |
| **Creative aesthetics** (distinctive look, avoid AI slop) | `frontend-design` | `~/.pi/agent/skills/frontend-design/SKILL.md` |
| **Composition & theory** (hierarchy, color, spacing, Gestalt) | `ui-design` | `~/.pi/agent/skills/ui-design/SKILL.md` |
| **Pattern research** (what do real apps do?) | `ui-patterns` | `~/.pi/agent/skills/ui-patterns/SKILL.md` |
| **Mobile web** (viewport, touch, fluid type, safe areas) | `mobile-first` | `~/.pi/agent/skills/mobile-first/SKILL.md` |
| **Stock photos** (search + verify, zero broken images) | `unsplash` | `~/.pi/agent/skills/unsplash/SKILL.md` |
| **shadcn/ui** (accessible primitives, MCP server) | `shadcn-ui` | `~/.pi/agent/skills/shadcn-ui/SKILL.md` |
| **Static art** (posters, PDF, PNG, visual philosophy) | `canvas-design` | `~/.pi/agent/skills/canvas-design/SKILL.md` |
| **Photo search** (multi-source: Serper, Unsplash, Pexels) | `photo-finder` | `~/.pi/agent/skills/photo-finder/SKILL.md` |

---

## Workflows

### Build a page from scratch
```
1. ui-patterns     → Research: what do the best apps do for this type of page?
2. ui-design       → Plan: composition, hierarchy, color palette, typography
3. component-craft → Source: grab premium components from 21st.dev / Magic UI
4. shadcn-ui       → Foundation: accessible primitives (dialog, tabs, forms)
5. unsplash        → Photos: search + verify stock images for visual sections
6. frontend-design → Execute: apply distinctive aesthetics, no generic AI look
7. mobile-first    → Audit: touch targets, fluid type, viewport, safe areas
```

### Redesign / improve existing UI
```
1. ui-design       → Diagnose: what's wrong (hierarchy? spacing? color?)
2. ui-patterns     → Compare: what do competitors/best-in-class do?
3. component-craft → Upgrade: replace plain cards with image-overlay, glass, etc.
4. frontend-design → Polish: distinctive touches (motion, typography, texture)
5. mobile-first    → Verify: does it work on 390px? Touch targets? Fluid type?
```

### Need photos for content
```
1. unsplash        → Search Unsplash/Pexels APIs, verify every URL loads
2. photo-finder    → Broader search (Serper/Google Images + above)
```

### Create visual art / poster / PDF
```
1. canvas-design   → Full pipeline: philosophy → canvas → refinement
```

---

## Quick Reference: Design Principles

These are the core rules baked across all sub-skills. Internalize them.

### Visual Hierarchy (from `ui-design`)
- **Scale** = importance. Larger draws eye first.
- Max 3 typographic levels visible at once.
- 60/30/10 color distribution (dominant/secondary/accent).
- 8px spacing rhythm: 4, 8, 16, 24, 32, 48, 64.

### No AI Slop (from `frontend-design`)
- ❌ Inter/Roboto/Arial everywhere
- ❌ Purple gradients on white
- ❌ Cookie-cutter layouts
- ✅ Intentional font pairing (display + body)
- ✅ Dominant color with sharp accent
- ✅ One memorable design decision per page

### Mobile Reality (from `mobile-first`)
- `100dvh` not `100vh`
- Inputs ≥ 16px (prevents iOS zoom)
- Touch targets ≥ 44px
- `clamp()` for fluid type: `clamp(1rem, 0.9rem + 0.5vw, 1.125rem)`
- `touch-action: manipulation` (kills 300ms delay)

### Component Quality (from `component-craft`)
- Image cards: gradient overlay `from-black/70 via-black/30 to-transparent`
- Hover: `group-hover:scale-105 transition-transform duration-700`
- Glass: `bg-white/5 backdrop-blur-xl border border-white/10`
- Always `loading="lazy"` on images below fold
- Always `<img>` (not Next.js `<Image>`) for external URLs

### Photos (from `unsplash`)
- Every URL must pass HEAD check before embedding
- Unsplash: `?w=800&q=80&auto=format` (controlled size, auto WebP)
- Pexels: use `src.large2x` for cards
- Re-verify before deploy — URLs can die

---

## Decision: Which Libraries?

```
Project type → Library choice:

SaaS dashboard        → shadcn/ui + Tailwind (sober, functional)
Marketing/landing     → Aceternity UI + Magic UI (animated, impressive)
Travel/content site   → component-craft patterns + unsplash (photo-rich)
Design system         → shadcn/ui as base, customize everything
Creative portfolio    → frontend-design skill (push boundaries)
Mobile-first app      → shadcn/ui + mobile-first skill (practical)
```

---

## Checklist Before Shipping

From `ui-design` + `mobile-first` combined:

- [ ] **Hierarchy**: Obvious where to look first, 3 clear typographic levels
- [ ] **Contrast**: ≥ 4.5:1 text, ≥ 3:1 UI elements
- [ ] **Touch targets**: ≥ 44px with ≥ 8px gap
- [ ] **Fluid type**: All text uses `clamp()`, no fixed px
- [ ] **Images verified**: HEAD-checked, lazy-loaded, `<img>` for external
- [ ] **Hover states**: No layout shift, 150–300ms transitions
- [ ] **Mobile tested**: 375px, 390px, 768px, 1024px, 1440px
- [ ] **No scroll issues**: `overscroll-behavior: contain` on scroll containers
- [ ] **Reduced motion**: `prefers-reduced-motion` respected
- [ ] **No emojis**: Use SVG icons (Lucide, Heroicons) for everything. Emojis are amateur hour — only acceptable for user-generated content or chat bubbles, never in designed UI.

---

## Skill Overlap Report

| Area | Primary Skill | Also In | Status |
|------|--------------|---------|--------|
| Color theory | `ui-design` | `frontend-design` (briefly) | ✅ No conflict — ui-design = theory, frontend-design = application |
| Typography | `ui-design` (scale, pairing) | `mobile-first` (fluid clamp) | ✅ Complementary |
| Component sourcing | `component-craft` | `shadcn-ui` | ✅ component-craft = premium/animated, shadcn = foundation |
| Photo search | `unsplash` | `photo-finder` | ⚠️ Overlap — unsplash = verified stock, photo-finder = multi-source broader. Both valid. |
| Patterns | `ui-patterns` | `component-craft` | ✅ ui-patterns = research/exploration, component-craft = implementation |
| Accessibility | `shadcn-ui` | `ui-design` (contrast checks) | ✅ shadcn = baked-in a11y, ui-design = checklist |
| Mobile | `mobile-first` | `ui-design` (responsive checklist) | ✅ mobile-first = deep technical, ui-design = high-level |
| Aesthetics | `frontend-design` | `canvas-design` | ✅ frontend-design = web code, canvas-design = static art |
