# shadcn-ui MCP Workflow Examples

## Quick Reference

**MCP Server:** shadcn-ui v4 (multi-framework support)
**Installed:** ✅ Configured in Claude Desktop
**Frameworks:** React, Svelte, Vue, React Native

---

## Example 1: Building a Dashboard with shadcn-ui MCP

### Step 1: Query for Base Components

**You say:**
"I need to build a dashboard. Show me the shadcn card and table components."

**What happens:**
- Claude queries shadcn-ui MCP server
- Retrieves Card and Table component source code
- Gets demo implementations and usage patterns
- Provides TypeScript definitions

### Step 2: Apply Bold Aesthetic Direction

**Design Philosophy:** Brutalist Data Visualization
- Typography: Monospace (JetBrains Mono) for data, bold sans (Bebas Neue) for headers
- Colors: High-contrast black/white/red accent
- Layout: Asymmetric grid, overlapping cards
- Motion: Sharp, mechanical transitions

### Step 3: Transform Components

```tsx
// ❌ Generic shadcn Card (AI slop)
<Card>
  <CardHeader>
    <CardTitle>Analytics</CardTitle>
  </CardHeader>
</Card>

// ✅ Brutalist-transformed Card (distinctive)
<Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all rotate-[-0.5deg]">
  <CardHeader className="border-b-4 border-black bg-red-500">
    <CardTitle className="font-bebas-neue text-4xl tracking-wider uppercase">
      ANALYTICS//2026
    </CardTitle>
  </CardHeader>
</Card>
```

### Result
Production-ready dashboard with:
- ✅ Accessibility (from shadcn foundation)
- ✅ Best practices (from shadcn structure)
- ✅ UNFORGETTABLE design (from your creative vision)

---

## Example 2: Form Components with Minimalist Aesthetic

### Step 1: Query shadcn-ui MCP

**You say:**
"Show me the shadcn form, input, and button components."

### Step 2: Design Philosophy

**Aesthetic:** Japanese Minimalism
- Typography: Inter (body) + Noto Serif JP (headers)
- Colors: Soft grays (#F5F5F5, #E0E0E0), single accent (#2E7D32)
- Layout: Generous negative space, subtle borders
- Motion: Gentle fades, slow transitions (300ms+)

### Step 3: Transform

```tsx
// ❌ Generic shadcn Button
<Button>Submit</Button>

// ✅ Minimalist-transformed Button
<Button className="
  bg-transparent
  border border-gray-300
  text-gray-700
  hover:bg-gray-50
  hover:border-gray-400
  transition-all duration-300
  px-8 py-3
  font-light
  tracking-wide
  rounded-none
">
  Submit
</Button>
```

---

## Example 3: Multi-Framework Usage

### React Example

**Query:** "Show me the shadcn dialog component for React"

**Response:** shadcn-ui MCP returns React implementation

### Svelte Example

**Query:** "Show me the same dialog component for Svelte"

**Response:** shadcn-ui MCP returns Svelte 5 implementation

**Benefit:** Consistent component logic across different frameworks, customized with your aesthetic

---

## Example 4: Using Blocks for Rapid Prototyping

### Query shadcn-ui MCP for Blocks

**You say:**
"Show me the shadcn dashboard block."

**What you get:**
- Complete dashboard layout
- Pre-configured components
- Chart integrations
- Navigation structure

### Transform the Block

Apply your aesthetic direction:
- Change color palette (avoid generic purples/blues)
- Replace typography (no Inter/Roboto)
- Add unique animations
- Modify spatial composition

**Result:** Production-ready dashboard in 20% of the time, with 100% distinctive design

---

## Example 5: Metadata and Dependencies

### Query Component Metadata

**You say:**
"What dependencies does the shadcn select component need?"

**shadcn-ui MCP provides:**
- Required packages (@radix-ui/react-select, etc.)
- Peer dependencies
- Configuration requirements
- Installation instructions

**Benefit:** No manual documentation lookup, instant dependency info

---

## Workflow Comparison

### Before shadcn-ui MCP
```
1. Google "accessible select component react"
2. Read 10 Stack Overflow answers
3. Copy-paste code from 3 different sources
4. Fight with TypeScript errors
5. Manually add accessibility (ARIA, keyboard nav)
6. Debug for 2 hours
7. Add custom styling
8. Still looks generic
```

### After shadcn-ui MCP
```
1. Query: "Show me shadcn select component"
2. Get production-ready, accessible component
3. Apply bold aesthetic transformation
4. Done in 15 minutes
5. Distinctive, memorable design
```

---

## Best Practices

### ✅ DO

1. **Use shadcn-ui MCP for structure:**
   - Accessibility built-in
   - Best practices enforced
   - TypeScript definitions included

2. **Transform EVERY component:**
   - Apply your unique aesthetic direction
   - Change typography (no generic fonts)
   - Customize colors, spacing, motion
   - Make it UNFORGETTABLE

3. **Query for blocks when starting:**
   - Dashboard blocks
   - Form blocks
   - Calendar blocks
   - Saves 60-80% on scaffolding time

4. **Use metadata for dependencies:**
   - Instant package requirements
   - No manual documentation lookup
   - Faster setup

### ❌ DON'T

1. **Use shadcn components as-is:**
   - Generic shadcn aesthetics = AI slop
   - ALWAYS transform with your creative vision

2. **Copy examples verbatim:**
   - Examples are reference points
   - Your implementation should be DISTINCTIVE

3. **Ignore accessibility:**
   - shadcn-ui MCP provides accessible foundations
   - Don't break them with your customizations

4. **Settle for generic:**
   - Every design should be different
   - Avoid repeating the same aesthetic choices

---

## Advanced Workflow: Multi-Step Dashboard

### Step 1: Query Multiple Components
"Show me shadcn card, table, chart, and navigation components."

### Step 2: Choose Bold Aesthetic
**Direction:** Retro-Futuristic Data Terminal
- Fonts: Space Mono (code), Orbitron (headers)
- Colors: Neon cyan (#00FFFF), dark purple (#1A0033), electric pink accent
- Effects: CRT scanlines, glow effects, monochrome data
- Motion: Glitch transitions, terminal-style reveals

### Step 3: Transform Components
```tsx
// Retro-futuristic Card with CRT effect
<Card className="
  bg-[#1A0033]
  border-2 border-cyan-400
  shadow-[0_0_20px_rgba(0,255,255,0.5)]
  relative
  overflow-hidden
  before:absolute before:inset-0
  before:bg-[linear-gradient(0deg,transparent_50%,rgba(0,255,255,0.03)_50%)]
  before:bg-[length:100%_4px]
  before:pointer-events-none
">
  <CardHeader className="border-b border-cyan-400/30">
    <CardTitle className="
      font-orbitron
      text-cyan-400
      text-2xl
      tracking-widest
      drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]
    ">
      DATA_TERMINAL
    </CardTitle>
  </CardHeader>
  {/* CRT scanline effect */}
</Card>
```

### Result
- ✅ Production-ready accessibility (from shadcn)
- ✅ Best practices structure (from shadcn)
- ✅ Retro-futuristic aesthetic (from you)
- ✅ UNFORGETTABLE design that screams 80s cyberpunk

---

## Key Takeaways

`★ Insight ─────────────────────────────────────`
**1. shadcn-ui MCP = Foundation, NOT Final Product**
- Provides: Structure, accessibility, best practices
- You provide: Soul, distinctiveness, creative vision

**2. The Transformation Formula**
```
shadcn component (structure)
  + Your aesthetic direction (soul)
  + Custom typography (distinctive)
  + Unique colors/motion (memorable)
  = Unforgettable UI (production-ready)
```

**3. Time Savings Focus on Design**
- 60-80% faster scaffolding
- More time for creative choices
- Focus shifts from "how" to "what makes this memorable"

**4. Never Settle for Generic**
- shadcn components are STARTING POINTS
- Transform, customize, make it yours
- Generic shadcn aesthetics = AI slop
- Your job: Make it UNFORGETTABLE
─────────────────────────────────────────────────`

---

## Next Steps

1. **Restart Claude Code** to load shadcn-ui MCP server
2. **Test queries:**
   - "Show me the shadcn button component"
   - "What's in the shadcn dashboard block?"
   - "Show me shadcn card component for Svelte"
3. **Build something:**
   - Choose a bold aesthetic direction
   - Query shadcn-ui MCP for base components
   - Transform them with your creative vision
4. **Iterate:**
   - Experiment with different aesthetics
   - Never repeat the same design choices
   - Push boundaries with each project
