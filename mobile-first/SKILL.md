---
name: mobile-first
description: "Mobile web cheat sheet: the non-obvious stuff — viewport traps, touch gotchas, CSS tricks, input zoom, gesture timing, container queries, fluid type. Use when building any mobile web UI."
---

# Mobile Web — The Non-Obvious Stuff

Things that are easy to forget, hard to debug, and not in Tailwind docs.

---

## Viewport Traps

```css
/* 100vh is BROKEN on mobile — includes URL bar */
html { height: 100vh; }   /* ❌ content hides behind browser chrome */
html { height: 100dvh; }  /* ✅ dynamic — shrinks when keyboard opens */
html { height: 100svh; }  /* smallest viewport (keyboard open) */
html { height: 100lvh; }  /* largest viewport (chrome hidden) */

/* Fallback for older browsers */
html {
  height: 100vh;
  height: 100dvh;
}
```

**Required meta** — without `viewport-fit=cover`, `env(safe-area-*)` returns 0:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

---

## Safe Areas (Notch / Dynamic Island / Home Indicator)

```css
.app {
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
           env(safe-area-inset-bottom) env(safe-area-inset-left);
}

/* Fixed bottom bar — MUST add safe area or home indicator covers it */
.bottom-bar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}
```

Tailwind v4 custom utilities:

```css
@utility safe-area-pb { padding-bottom: env(safe-area-inset-bottom); }
@utility safe-area-pt { padding-top: env(safe-area-inset-top); }
```

---

## iOS Input Zoom Prevention

Safari zooms in on any `<input>` with font-size < 16px. This is the #1 mobile web bug.

```css
input, select, textarea {
  font-size: 16px;  /* or larger — prevents auto-zoom */
}
```

---

## Touch Gotchas

```css
/* Kill 300ms tap delay (legacy holdover for double-tap zoom) */
* { touch-action: manipulation; }

/* Kill blue/grey tap flash on Android/iOS */
* { -webkit-tap-highlight-color: transparent; }

/* Prevent text selection on interactive elements */
.interactive { user-select: none; }

/* Prevent scroll chaining (child scroll doesn't propagate to parent) */
.scroll-container { overscroll-behavior: contain; }

/* Body scroll lock when modal/drawer is open */
body.locked { overflow: hidden; position: fixed; inset: 0; }
/* ⚠️ position:fixed resets scroll position — save/restore scrollY in JS */
```

---

## Touch Targets

- **Minimum:** 44×44px (Apple) / 48×48dp (Material)
- **Gap between targets:** ≥ 8px
- **Thumb zone:** Primary actions in bottom 40% of screen

Extended touch target trick — visible element is small, tap area is large:

```html
<a href="/link" class="relative text-sm">
  Small link
  <span class="absolute -inset-3" aria-hidden="true"></span>
</a>
```

---

## Gesture Timing

| Gesture | Max response time | Release animation | Easing |
|---------|------------------|-------------------|--------|
| Tap | **≤ 50ms** | 200ms | ease-out + overshoot |
| Long press | ≤ 50ms | 300ms | ease-out |
| Drag | ≤ 100ms | 300ms | spring |
| Swipe | — | 200–400ms | ease-out |

> If response > 100ms, it feels disconnected from the finger.

```css
/* Spring easing for release animations */
.spring { transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1); }

/* Button press feedback */
.btn:active { transform: scale(0.97); transition: transform 50ms ease-out; }
.btn:not(:active) { transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1); }
```

---

## Container Queries

Component-level responsive — reacts to parent width, not viewport. This is the modern way.

```css
.card-wrapper { container-type: inline-size; }

@container (min-width: 400px) {
  .card { flex-direction: row; }
}
```

Tailwind (with `@tailwindcss/container-queries`):

```html
<div class="@container">
  <div class="flex flex-col @sm:flex-row @lg:gap-6">
    <!-- responds to container, not viewport -->
  </div>
</div>
```

| Use container queries | Use media queries |
|----------------------|-------------------|
| Reusable components, cards, widgets | Page layout, nav, hero |
| Sidebar content, embedded widgets | Full-width sections |

---

## Fluid Typography

No breakpoint jumps. Scales smoothly between min and max.

```css
:root {
  --text-sm:  clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-lg:  clamp(1.25rem, 1rem + 1.25vw, 1.5rem);
  --text-xl:  clamp(1.5rem, 1.1rem + 2vw, 2rem);
  --text-2xl: clamp(1.875rem, 1.2rem + 3.375vw, 2.5rem);
  --text-3xl: clamp(2.25rem, 1rem + 6.25vw, 3.5rem);
}
```

> Always `rem + vw` in clamp — pure `vw` breaks user zoom (WCAG violation).

Fluid spacing follows same pattern:

```css
:root {
  --space-sm: clamp(0.5rem, 0.4rem + 0.5vw, 1rem);
  --space-md: clamp(1rem, 0.75rem + 1.25vw, 2rem);
  --space-lg: clamp(1.5rem, 1rem + 2.5vw, 3rem);
  --space-section: clamp(4rem, 2rem + 10vw, 8rem);
}
```

---

## CSS Tricks You'll Need

```css
/* Prevent orphans in headings */
h1, h2 { text-wrap: balance; }

/* Skip rendering off-screen content (massive perf win for long pages) */
.offscreen-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;
}

/* Respect "save data" preference */
@media (prefers-reduced-data: reduce) {
  img, video { display: none; }
  .hero { background-image: none; }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Smooth scrolling only if user hasn't disabled motion */
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}
```

---

## Mobile Form Inputs

```html
<!-- Right keyboard for the job -->
<input inputmode="numeric" pattern="[0-9]*" />   <!-- number pad -->
<input inputmode="email" autocomplete="email" />
<input inputmode="tel" autocomplete="tel" />
<input inputmode="url" />
<input inputmode="search" enterkeyhint="search" />
<input inputmode="decimal" />                      <!-- number pad + dot -->

<!-- OTP field -->
<input inputmode="numeric" autocomplete="one-time-code"
       pattern="[0-9]{6}" maxlength="6" />

<!-- Submit button hint on keyboard -->
<input enterkeyhint="next" />   <!-- shows → -->
<input enterkeyhint="done" />   <!-- shows ✓ -->
<input enterkeyhint="send" />   <!-- shows send -->
<input enterkeyhint="go" />     <!-- shows go -->
```

---

## Dark Mode + Theme Color

```html
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)">
```

This colors the browser chrome (URL bar) to match your app.

---

## Quick Audit

When reviewing any mobile web page, check these:

1. **Viewport:** `viewport-fit=cover` present?
2. **dvh:** Using `dvh` not `vh` for full-height?
3. **Input zoom:** All inputs ≥ 16px font?
4. **Touch targets:** ≥ 44px with ≥ 8px gap?
5. **Safe areas:** Bottom bar has `env(safe-area-inset-bottom)`?
6. **Tap delay:** `touch-action: manipulation` set?
7. **Scroll lock:** Modal/drawer locks body scroll?
8. **Fluid type:** Using `clamp()` not fixed breakpoint jumps?
9. **Reduced motion:** Animations respect `prefers-reduced-motion`?
10. **Contrast:** ≥ 4.5:1 text, ≥ 3:1 UI elements?
