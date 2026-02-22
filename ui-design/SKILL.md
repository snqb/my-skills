---
name: ui-design
description: "Complete UI/UX design system: 50+ styles, 97 palettes, 57 font pairings, composition principles, visual hierarchy, Gestalt, accessibility. Use for: design, build, review, fix UI. Covers React, Next.js, Vue, Svelte, SwiftUI, Flutter, Tailwind, shadcn/ui."
---

# UI Design — Styles + Composition + Implementation

Complete design intelligence: searchable database (styles, colors, typography) + visual composition theory + stack-specific implementation.

## Quick Start

```bash
# Generate complete design system for a project
python3 skills/ui-design/scripts/search.py "beauty spa wellness" --design-system -p "Serenity Spa"

# Search specific domains
python3 skills/ui-design/scripts/search.py "glassmorphism dark" --domain style
python3 skills/ui-design/scripts/search.py "elegant luxury" --domain typography

# Stack-specific guidelines
python3 skills/ui-design/scripts/search.py "responsive form" --stack html-tailwind
```

---

## Part 1: Design System Generator

### Workflow

1. **Analyze Requirements** — Product type, style keywords, industry, stack
2. **Generate Design System** — `--design-system` flag for comprehensive recommendations
3. **Supplement with Searches** — Domain-specific deep dives
4. **Apply Stack Guidelines** — Implementation best practices

### Available Domains

| Domain | Use For |
|--------|---------|
| `product` | SaaS, e-commerce, portfolio, healthcare |
| `style` | glassmorphism, minimalism, brutalism |
| `typography` | Font pairings by mood |
| `color` | Palettes by product type |
| `landing` | Page structure, CTA strategies |
| `chart` | Data visualization |
| `ux` | Best practices, anti-patterns |

### Available Stacks

`html-tailwind` (default), `react`, `nextjs`, `vue`, `svelte`, `swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`

### Persist Design System

```bash
# Save as Master + page overrides
python3 skills/ui-design/scripts/search.py "fintech dashboard" --design-system --persist -p "FinApp"
```

Creates:
- `design-system/MASTER.md` — Global source of truth
- `design-system/pages/` — Page-specific overrides

---

## Part 2: Visual Composition

### Core Principles

#### 1. Visual Hierarchy

Guide attention to important elements first.

| Technique | How |
|-----------|-----|
| Scale | Larger = more important |
| Contrast | High contrast draws eye |
| Position | Top/center noticed first |
| Typography | Size + weight create levels |

**Example hierarchy:**
```
1. Hero heading (48px, bold)
2. Subheading (24px, medium)
3. Body (16px, regular)
4. CTA button (accent color)
```

#### 2. Balance

Equally distributed visual weight (not necessarily symmetrical).

- **Symmetrical** — Formal, stable (login forms, corporate)
- **Asymmetrical** — Dynamic, engaging (modern web apps)
- **Radial** — Center focus (loading spinners, logos)

#### 3. Visual Weight

Factors: size, color (warm > cool), saturation, position, isolation, texture.

```
Heavy (draw attention):     Light (supporting):
- Large hero images         - Body text
- Bright CTA buttons        - Low-contrast backgrounds
- Isolated floating cards   - Grouped items
```

#### 4. Gestalt Principles

| Principle | Application |
|-----------|-------------|
| Proximity | Group related fields |
| Similarity | Consistent button styles |
| Closure | Minimal icons, implied shapes |
| Continuity | Timelines, breadcrumbs |
| Figure/Ground | Modal overlays, card elevation |

#### 5. Typography Scale

```
Display: 60-96px (hero)
H1: 48px (page title)
H2: 36px (section)
H3: 24px (subsection)
Body: 16-18px
Small: 14px (captions)
```

- Line length: 50-75 characters
- Line height: 1.5-1.75 (body), 1.1-1.3 (headings)
- Max 2-3 font families

#### 6. Color Strategy

- **Dominant** (60%) — Primary color
- **Secondary** (30%) — Supporting
- **Accent** (10%) — CTAs, highlights

Contrast: WCAG AA minimum 4.5:1 for text.

#### 7. Spacing Rhythm

Use consistent scale: 4, 8, 16, 24, 32, 48, 64px (multiples of 8).

---

## Part 3: Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis as icons (use SVG: Heroicons, Lucide)
- [ ] Consistent icon set
- [ ] Hover states don't cause layout shift
- [ ] Transitions 150-300ms

### Hierarchy
- [ ] Obvious where to look first
- [ ] Sizes reflect importance
- [ ] Clear typography levels

### Balance
- [ ] Layout feels stable
- [ ] Visual weights distributed
- [ ] Works at all screen sizes

### Accessibility
- [ ] 4.5:1 contrast ratio minimum
- [ ] Visible focus states
- [ ] Alt text on images
- [ ] `prefers-reduced-motion` respected

### Responsive
- [ ] Test 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] Touch targets 44x44px minimum

---

## Anti-Patterns

| ❌ Don't | ✅ Do |
|---------|------|
| Make everything bold/large | Use de-emphasis for hierarchy |
| 4+ font families | Max 2-3, vary weight instead |
| Random spacing | Consistent 8px scale |
| Center everything | Use asymmetry for interest |
| Borders everywhere | Shadows, backgrounds, space |
| Emojis as icons | SVG icon library |

---

## Common Rules

### Icons & Logos
- Use SVG icons (Heroicons, Lucide, Simple Icons)
- Research official brand logos
- Consistent icon sizing (24x24 viewBox)

### Interaction
- `cursor-pointer` on all clickable elements
- Hover feedback (color, shadow, border change)
- Smooth transitions (`transition-colors duration-200`)

### Light/Dark Mode
- Light mode: `bg-white/80+`, text `slate-900`, muted `slate-600`
- Dark mode: higher opacity, lower contrast
- Test both modes before delivery

### Layout
- Floating navbar: `top-4 left-4 right-4` spacing
- Account for fixed header height
- Consistent `max-w-6xl` or `max-w-7xl`

---

## Related Skills

| Skill | When to Use |
|-------|-------------|
| **`ui-patterns`** | Research first — see real dropdowns, accordions, inputs from Collect UI, Component Gallery, Mobbin |
| **`frontend-design`** | Execute with distinctive aesthetics, avoid generic AI look |
| **`shadcn-ui`** | Get accessible component foundations to customize |

**Recommended workflow**: `ui-patterns` (research) → `ui-design` (principles) → `frontend-design` (execution)

---

## Resources

- [Refactoring UI](https://www.refactoringui.com/)
- [Designing Interfaces](https://www.oreilly.com/library/view/designing-interfaces-3rd/9781492051954/)
- [Butterick's Practical Typography](https://practicaltypography.com/)
- [Laws of UX](https://lawsofux.com/)
