---
name: design-audit
description: "Detect and fix design system leaks — default shadcn/bootstrap/MUI styling breaking through your brand. Use when: UI feels 'template-y', 'looks like shadcn', 'too generic', buttons are inconsistent colors, cards look default, or after shipping many features fast. Also: 'audit my design', 'check consistency', 'brand leak', 'fix the defaults'."
---

# Design Audit — Kill the Defaults

Find where component library defaults leak through your brand. Fix them.

## When to Use

- "This looks like shadcn out of the box"
- "Some buttons are black, some are blue, some are green"
- "The cards feel generic"
- After a sprint of feature work (consistency drifts)
- Before launch / client review

## Process

### 1. Extract Brand DNA (5 min)

Before auditing, know what the brand actually is. Check existing files:

```bash
# Find brand colors already in use
rg "#[0-9a-fA-F]{6}" src/ --type css --type tsx -o | sort | uniq -c | sort -rn | head -20
rg "bg-\[#" src/ --type tsx -o | sort | uniq -c | sort -rn | head -10

# Find the accent color (most-used non-gray hex)
rg "bg-\[#|text-\[#|border-\[#" src/ -o | grep -v "gray\|white\|black" | sort | uniq -c | sort -rn | head -5

# Check tailwind config for custom colors
cat tailwind.config.* 2>/dev/null | grep -A5 "colors"
```

Result: one accent color, one secondary, warm vs cool palette.

### 2. Screenshot Sweep (ABP)

Systematic screenshots of every page/section. Use browser automation:

```bash
B=~/.pi/agent/skills/browser-testing/browser.js

# Per page: top + scroll to each section
$B nav "$URL" --port 8222
$B wait 4000 --port 8222
$B screenshot --port 8222 --markup none

# Scroll through in chunks
for dy in 1500 3000 4500 6000; do
  $B scroll 640 400 --dy $dy --port 8222
  $B wait 300 --port 8222
  $B screenshot --port 8222 --markup none
done
```

For batch (many pages):
```bash
for page in $PAGES; do
  $B nav "$BASE/$page" --port 8222
  $B wait 4000 --port 8222
  $B screenshot --port 8222 --markup none --format png
  # save with page name
done
```

### 3. Identify Leaks

Look for these **7 common leaks** in screenshots:

#### Leak 1: Black Buttons (most common)
**Symptom**: `bg-gray-900` / `bg-black` CTA buttons when brand has a color.
shadcn `Button` default is dark. Devs never override it.

**Fix**: Replace with brand accent. All primary CTAs = one color.
```
bg-gray-900 → bg-[#BRAND]
hover:bg-gray-800 → hover:bg-[#BRAND_DARK]
```

#### Leak 2: Pill Tabs vs Everything Else
**Symptom**: Navigation tabs are heavy black pills (`bg-gray-900 text-white rounded-full`) but the rest of the page is light and airy.

**Fix**: Underline tabs are lighter. Reserve pills for filters/toggles.
```
# Heavy pill (before)
bg-gray-900 text-white rounded-full

# Light underline (after)
border-b-2 border-[#BRAND] text-gray-900
```

#### Leak 3: Plain Cards Without Identity
**Symptom**: Grid of cards where each card is just `border border-gray-100 rounded-xl p-4` + bold title + body text. No icons, no color differentiation. Could be any website.

**Fix**: Add per-category visual identity:
- Colored icon in a tinted circle (`bg-blue-50` + `text-blue-500`)
- Subtle tinted border/bg per category
- Different icon per card, not same generic one

#### Leak 4: Generic Placeholder Icons
**Symptom**: Hotel/building/file icons where content-specific icons should be.
`<Hotel className="w-4 h-4 text-gray-500" />` for every hotel regardless of tier.

**Fix**: Star-tier colors, category-specific icons, or just remove the icon if it adds nothing.

#### Leak 5: Centered All-Caps Labels
**Symptom**: `text-center uppercase tracking-wider text-gray-400` on cards.
Classic Bootstrap pricing table pattern.

**Fix**: Left-align. Use colored dots or accent-colored labels instead of gray caps.
```
# Bootstrap-y (before)
<span className="text-center uppercase text-gray-400">BUDGET</span>
<div className="text-2xl font-bold text-center">$25-40</div>

# Branded (after)
<div className="flex items-center gap-2">
  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
  <span className="text-emerald-600 text-xs uppercase font-semibold">Budget</span>
</div>
<div className="text-2xl font-bold">$25-40</div>
```

#### Leak 6: Mixed Accent Colors
**Symptom**: CTA #1 is `bg-emerald-600`, CTA #2 is `bg-gray-900`, CTA #3 is `bg-blue-600`. Three competing accent colors = no brand identity.

**Fix**: One primary accent for all CTAs. Secondary actions get ghost/outline style.
```
Primary: bg-[#BRAND] text-white
Secondary: bg-white text-[#BRAND] border border-[#BRAND]
Tertiary: text-[#BRAND] (text link)
Ghost: bg-white/15 text-white (on dark backgrounds)
```

#### Leak 7: Shadow/Radius Inconsistency
**Symptom**: Some cards `rounded-lg`, some `rounded-xl`, some `rounded-2xl`. Some with `shadow-sm`, some with `shadow-lg`, some with none.

**Fix**: Pick one radius for cards, one for buttons, one for pills. Document it.

### 4. Fix Pattern

For each leak found:

1. **Search for all instances** — don't fix one button and leave 6 others
```bash
grep -rn "bg-gray-900" src/pages/ src/common/ --include="*.tsx" | grep -v "//\|bg-gray-900 text-white p-4" # exclude content blocks
```

2. **sed for mechanical replacements** — when pattern is exact
```bash
sed -i '' 's/bg-gray-900 hover:bg-gray-800/bg-[#FF611E] hover:bg-[#e8561a]/g' src/pages/guide/\[code\].tsx
```

3. **Before/after screenshots** — always visual proof
```bash
# Comparison image (ImageMagick)
magick before.png after.png \
  \( -clone 0 -resize 640x -splice 0x30 -annotate +10+20 "BEFORE" \) \
  \( -clone 1 -resize 640x -splice 0x30 -annotate +10+20 "AFTER" \) \
  -delete 0,1 +append comparison.png
```

4. **Type-check after changes**
```bash
npx tsc --noEmit
```

### 5. Document Brand Rules

After fixing, add to project's AGENTS.md or a `brand.md`:

```markdown
## Brand / UI Rules
- **Accent**: #XXXX (all primary CTAs, active states, icons on hero)
- **Active tab**: underline `border-b-2 border-[#XXXX]`, not black pill
- **Cards**: colored icon per category in tinted circle
- **CTA hierarchy**: accent bg primary → white/ghost secondary → text link tertiary
- **Never**: bg-gray-900 for interactive elements (only for content blocks)
- **Radius**: xl for cards, lg for buttons, full for pills/badges
- **Shadows**: sm for cards, lg for floating elements, orange-glow for primary CTA
```

This prevents drift in future sessions.

## Checklist

Quick scan — rate each 1-5 for "how default does this look":

- [ ] Primary CTA button — uses brand color?
- [ ] Navigation tabs — match page weight?
- [ ] Card grids — have per-item visual identity?
- [ ] Icons — content-specific or generic placeholders?
- [ ] Labels — left-aligned and branded or centered gray caps?
- [ ] Accent colors — one primary or competing?
- [ ] Radius/shadow — consistent across components?
- [ ] Hover states — branded or just `hover:bg-gray-100`?
- [ ] Empty states — designed or just "No data"?
- [ ] Loading states — branded spinner or generic?

Score < 30 = needs audit. Score > 40 = probably fine.

## Anti-Patterns

**Don't**:
- Replace ALL gray with accent color (over-branding)
- Make every element colorful (visual noise)
- Add animations to fix design problems
- Use gradients to hide flat design

**Do**:
- One accent, used consistently
- Secondary elements stay neutral
- Color = meaning (categories, tiers, status)
- White space > decoration
