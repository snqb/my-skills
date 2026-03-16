---
name: component-craft
description: "Source beautiful React/Tailwind components from 21st.dev, Magic UI, Aceternity UI, and other community registries. Use when building UI that needs to look better than generic shadcn — hero sections, animated cards, gradient effects, glassmorphism, image overlays, bento grids, etc."
---

# Component Craft — Premium UI from Community Registries

Source production-quality React/Tailwind components from the best community libraries. Goes beyond vanilla shadcn into polished, animation-rich, visually striking UI.

## When to Use

- Building a landing page, hero, or marketing section
- Need image-overlay cards, gradient borders, glass effects
- Want Framer Motion animations without writing from scratch
- Looking for bento grids, testimonials, pricing, feature sections
- Building a page that should look "designed" not "developed"

---

## Sources (ranked by quality + breadth)

### 1. 21st.dev — Community Component Marketplace

**What:** 500+ shadcn-compatible components from design engineers. The "npm for UI."
**Install:** `npx shadcn@latest add "https://21st.dev/r/AUTHOR/COMPONENT"`
**Browse:** https://21st.dev

#### Key Categories
| Category | Count | Examples |
|----------|-------|---------|
| Heroes | 73+ | Gradient hero, image hero, split hero, video bg |
| Features | 36+ | Bento grid, icon cards, comparison tables |
| Cards | 40+ | Glass card, image overlay, gradient border, tilt |
| Buttons | 30+ | Shimmer, magnetic, gradient, expanding |
| Testimonials | 20+ | Marquee, carousel, grid, single quote |
| Navigation | 11+ | Floating nav, command palette, sidebar |
| Backgrounds | 33+ | Dot grid, gradient mesh, aurora, particles |
| Calls to Action | 34+ | Banner CTA, inline CTA, sticky CTA |
| Pricing | 15+ | Toggle, comparison, featured tier |

#### Browse by URL
```
https://21st.dev/community/components          # All components
https://21st.dev/community/components?tab=heroes
https://21st.dev/community/components?tab=features
https://21st.dev/community/components?tab=cards
https://21st.dev/community/components?tab=buttons
https://21st.dev/community/components?tab=backgrounds
https://21st.dev/community/components?tab=testimonials
```

#### MCP Server (AI-powered generation)
21st.dev offers an MCP server called **Magic** for AI-powered component creation:

```json
// Claude Desktop / Cursor / Windsurf MCP config
{
  "mcpServers": {
    "21st_magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": { "TWENTY_FIRST_API_KEY": "YOUR_KEY" }
    }
  }
}
```

Get API key: https://21st.dev/magic/console

**Prompt pattern:** `/ui create a [component] with [style]`

---

### 2. Magic UI — 150+ Animated Components

**What:** Free, open-source animated components. Framer Motion + Tailwind. Perfect shadcn companion.
**Install:** `npx shadcn@latest add "https://magicui.design/r/COMPONENT"`
**Browse:** https://magicui.design
**GitHub:** https://github.com/magicuidesign/magicui (18k+ ★)

#### Best Components
| Component | Use For |
|-----------|---------|
| `marquee` | Infinite scroll logos/testimonials |
| `bento-grid` | Feature sections with mixed sizes |
| `dock` | macOS-style dock navigation |
| `globe` | 3D interactive globe |
| `particles` | Particle background effects |
| `shimmer-button` | CTA buttons with shimmer |
| `number-ticker` | Animated counting numbers |
| `orbiting-circles` | Orbital animation |
| `shine-border` | Animated border glow |
| `animated-list` | Staggered list reveal |
| `blur-fade` | Blur-to-focus text reveal |
| `word-rotate` | Rotating text animation |

```bash
# Install example
npx shadcn@latest add "https://magicui.design/r/marquee"
npx shadcn@latest add "https://magicui.design/r/bento-grid"
```

---

### 3. Aceternity UI — 330+ Premium Components

**What:** Beautiful animated components. Best for landing pages. Mix of free + paid (All Access $49).
**Browse:** https://ui.aceternity.com/components
**Docs:** https://ui.aceternity.com

#### Standout Components (Free)
| Component | Visual Effect |
|-----------|--------------|
| `background-beams` | Animated beam lines |
| `spotlight` | Mouse-following spotlight |
| `3d-card` | Tilt/parallax card effect |
| `text-generate-effect` | Character-by-character text reveal |
| `sparkles` | Sparkle particles on text |
| `infinite-moving-cards` | Auto-scrolling testimonials |
| `tabs` | Animated underline tabs |
| `sticky-scroll-reveal` | Content reveals on scroll |
| `tracing-beam` | SVG path tracing on scroll |
| `background-gradient` | Animated gradient mesh |
| `aurora-background` | Northern lights effect |
| `floating-dock` | macOS dock with physics |

#### Install Pattern
```bash
# Aceternity uses direct copy-paste (not npx shadcn)
# Browse component → copy code → paste into your project
# Requires: framer-motion, tailwindcss, clsx, tailwind-merge
```

---

### 4. Cult UI — Emerging Components

**Browse:** https://www.cult-ui.com
**Focus:** Micro-interactions, creative UI experiments

Notable: `hover-card-gradient`, `morphing-dialog`, `expanding-card`

---

### 5. Indie UI — Dark-First Templates

**Browse:** https://ui.indie-starter.dev
**Focus:** SaaS templates, dark mode, minimal aesthetic

---

### 6. Lukacho UI — Animated Primitives

**Browse:** https://ui.lukacho.com
**Focus:** Animated borders, buttons, text effects

---

## Design Patterns (Copy These)

### Image-Overlay Card (Travel/Resort)
```tsx
<div className="group relative h-[240px] rounded-2xl overflow-hidden">
  <img
    src={imageUrl}
    alt={title}
    className="absolute inset-0 w-full h-full object-cover
               transition-transform duration-700 group-hover:scale-105"
    loading="lazy"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
  <div className="relative z-10 flex flex-col justify-end h-full p-4">
    <span className="text-xs text-white/60 font-medium uppercase tracking-wider">{subtitle}</span>
    <h3 className="text-white font-bold text-lg">{title}</h3>
    <p className="text-white/80 text-sm line-clamp-2 mt-1">{description}</p>
  </div>
</div>
```

### Glass Card
```tsx
<div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6
                shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
  {/* content */}
</div>
```

### Gradient Border Card
```tsx
<div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
  <div className="rounded-2xl bg-white dark:bg-gray-950 p-6">
    {/* content */}
  </div>
</div>
```

### Numbered Feature List
```tsx
{items.map((item, i) => (
  <div key={i} className="flex gap-4 py-4 border-b border-gray-100 last:border-none">
    <span className="shrink-0 w-8 h-8 rounded-full bg-blue-50 text-blue-600
                     flex items-center justify-center text-sm font-bold">
      {i + 1}
    </span>
    <div>
      <h4 className="font-semibold text-gray-900">{item.title}</h4>
      <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
    </div>
  </div>
))}
```

### Colored Icon Card (Practical Info)
```tsx
<div className="flex items-start gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
  <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
    <Icon className="w-4.5 h-4.5 text-blue-600" />
  </div>
  <div>
    <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{label}</span>
    <p className="text-sm text-gray-700 leading-relaxed mt-0.5">{value}</p>
  </div>
</div>
```

### Bento Grid
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 gap-3 auto-rows-[180px]">
  <div className="col-span-2 row-span-2 ...">Big feature</div>
  <div className="...">Small card</div>
  <div className="...">Small card</div>
  <div className="col-span-2 ...">Wide card</div>
</div>
```

---

## Decision Tree

```
Need a component?
├── Standard form/layout → shadcn-ui (skill: shadcn-ui)
├── Animated landing page → Aceternity UI or Magic UI
├── Community component exists → 21st.dev (search first!)
├── Image-heavy cards → Use image-overlay pattern above
├── Micro-interactions → Cult UI or Lukacho UI
└── Full page template → Magic UI templates or 21st.dev blocks
```

---

## Anti-Patterns

| ❌ Don't | ✅ Do |
|---------|------|
| Install a library for one component | Copy-paste the component code |
| Use animations everywhere | Animate key moments: page load, hover, scroll-into-view |
| Mix 3+ animation libraries | Pick one: Framer Motion (React) or CSS |
| Use heavy 3D/WebGL on mobile | Conditional: desktop only, or reduce to CSS |
| Copy 21st.dev components without customizing | Adapt colors, spacing, content to your brand |
| Forget `loading="lazy"` on image cards | Always lazy-load images below the fold |

---

## Related Skills

| Skill | When |
|-------|------|
| `shadcn-ui` | Base component structure + accessibility |
| `frontend-design` | Creative aesthetics, avoiding generic look |
| `ui-design` | Composition, hierarchy, color theory |
| `unsplash` | Verified stock photos for image cards |
| `mobile-first` | Touch targets, fluid type, viewport traps |
