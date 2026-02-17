# Vite-First Frontend Patterns

> **ANTI-PATTERN**: Next.js is BANNED. Use Vite for all frontend projects.

## Quick Start Templates

### React + Vite
```bash
npm create vite@latest my-app -- --template react-swc-ts
cd my-app && npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Stack:** React 18 + SWC (faster than Babel) + TypeScript + Vite

### Svelte + Vite
```bash
npm create vite@latest my-app -- --template svelte-ts
cd my-app && npm install
npm install -D @sveltejs/adapter-static
```

**Stack:** Svelte 5 + TypeScript + Vite
**Why:** Smallest bundle, fastest runtime, reactive by default

### Vue + Vite
```bash
npm create vite@latest my-app -- --template vue-ts
cd my-app && npm install
npm install pinia vue-router
```

**Stack:** Vue 3 + Composition API + TypeScript + Vite
**Why:** Best DX, progressive adoption, template syntax clarity

### Vanilla (No Framework)
```bash
npm create vite@latest my-app -- --template vanilla-ts
cd my-app && npm install
```

**Stack:** TypeScript + Vite + Web Components
**Why:** Zero framework overhead, native browser APIs, maximum control

---

## Framework Selection Guide

| Use Case | Framework | Why |
|----------|-----------|-----|
| **Interactive dashboards** | Svelte | Reactive state, minimal bundle |
| **Component libraries** | React | Ecosystem, job market |
| **Progressive enhancement** | Vue | Template syntax, gradual adoption |
| **Static sites** | Vanilla + Lit | No framework tax, web components |
| **Data visualization** | Svelte or Vanilla | Direct DOM manipulation performance |
| **Forms-heavy apps** | Vue | Two-way binding, form validation |

---

## Vite-Specific Optimizations

### 1. CSS Extraction
```ts
// vite.config.ts
export default {
  build: {
    cssCodeSplit: true, // Split CSS per route
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'], // Separate vendor bundle
        }
      }
    }
  }
}
```

### 2. Dynamic Imports
```tsx
// React lazy loading with Vite
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

<Suspense fallback={<Skeleton />}>
  <Routes>
    <Route path="/dash" element={<Dashboard />} />
    <Route path="/settings" element={<Settings />} />
  </Routes>
</Suspense>
```

### 3. Asset Handling
```ts
// Import assets with explicit URLs
import logoUrl from './logo.svg?url'           // Static URL
import logoRaw from './logo.svg?raw'           // Raw string
import Worker from './worker?worker'           // Web Worker
import glsl from './shader.glsl?raw'          // Shader code
```

### 4. Environment Variables
```ts
// .env.local (never commit!)
VITE_API_URL=http://localhost:3000
VITE_FEATURE_FLAG_NEW_UI=true

// Access in code
const apiUrl = import.meta.env.VITE_API_URL
const isNewUI = import.meta.env.VITE_FEATURE_FLAG_NEW_UI === 'true'
```

---

## Framework-Specific Patterns

### Svelte: Reactive Stores
```svelte
<script lang="ts">
  import { writable, derived } from 'svelte/store';

  const count = writable(0);
  const doubled = derived(count, $count => $count * 2);

  function increment() {
    count.update(n => n + 1);
  }
</script>

<button on:click={increment}>
  Count: {$count} (doubled: {$doubled})
</button>

<style>
  button {
    /* Scoped by default - no CSS-in-JS needed */
  }
</style>
```

### Vue: Composition API
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">
    Count: {{ count }} (doubled: {{ doubled }})
  </button>
</template>

<style scoped>
button {
  /* Scoped CSS via scoped attribute */
}
</style>
```

### React: Modern Patterns
```tsx
import { useState, useMemo } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  const doubled = useMemo(() => count * 2, [count])

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count} (doubled: {doubled})
    </button>
  )
}
```

---

## State Management (No Next.js)

### React: Zustand (Recommended)
```tsx
import { create } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

function Counter() {
  const { count, increment } = useStore()
  return <button onClick={increment}>{count}</button>
}
```

### Vue: Pinia (Official)
```ts
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment() { this.count++ }
  }
})
```

### Svelte: Context API
```svelte
<script lang="ts" context="module">
  import { writable } from 'svelte/store';
  import { setContext, getContext } from 'svelte';

  const key = Symbol('counter');

  export function createCounter() {
    const store = writable(0);
    setContext(key, store);
    return store;
  }

  export function getCounter() {
    return getContext(key);
  }
</script>
```

---

## Routing (No Next.js)

### React: React Router
```tsx
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

<BrowserRouter>
  <nav>
    <Link to="/">Home</Link>
    <Link to="/about">About</Link>
  </nav>

  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
  </Routes>
</BrowserRouter>
```

### Vue: Vue Router
```ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About }
  ]
})
```

### Svelte: SvelteKit (ONLY if full SSR needed)
```ts
// src/routes/+page.svelte (file-based routing)
<script lang="ts">
  export let data; // Type-safe props from loader
</script>

<h1>Welcome {data.user.name}</h1>

// src/routes/+page.ts (data loader)
export async function load({ fetch }) {
  const user = await fetch('/api/user').then(r => r.json())
  return { user }
}
```

**Note:** SvelteKit is acceptable ONLY when you need SSR/SSG. For SPAs, use Svelte + Vite + vanilla routing.

---

## Performance Budget (Vite)

| Metric | Target | Why |
|--------|--------|-----|
| **Initial JS** | < 50 KB gzipped | FCP under 1.5s on 4G |
| **CSS** | < 20 KB gzipped | LCP paint under 2s |
| **Lazy chunks** | < 30 KB each | Fast route transitions |
| **Bundle analysis** | Run `vite build --analyze` | Catch bloat early |

### Bundle Analysis
```bash
npm install -D rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default {
  plugins: [
    visualizer({ open: true, gzipSize: true })
  ]
}
```

---

## Anti-Patterns (NEVER DO THIS)

❌ **Don't use Next.js** - User explicitly hates it
❌ **Don't use Create React App** - Deprecated, use Vite
❌ **Don't install Webpack** - Vite replaces it
❌ **Don't use class components** - Hooks only
❌ **Don't use CSS-in-JS for everything** - CSS Modules or scoped styles preferred

✅ **DO use Vite** - Always
✅ **DO use modern build tools** - SWC, esbuild (Vite uses both)
✅ **DO use native CSS features** - Container queries, `:has()`, CSS nesting
✅ **DO use TypeScript** - Type safety prevents bugs

---

## Modern CSS (No Frameworks Required)

### CSS Variables + Color Schemes
```css
:root {
  --color-bg: hsl(0 0% 98%);
  --color-fg: hsl(0 0% 10%);
  --color-accent: hsl(280 80% 60%);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: hsl(0 0% 8%);
    --color-fg: hsl(0 0% 95%);
    --color-accent: hsl(280 70% 70%);
  }
}
```

### Container Queries (Better than Media Queries)
```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

.card-title {
  font-size: 1rem;
}

@container card (min-width: 400px) {
  .card-title {
    font-size: 1.5rem;
  }
}
```

### Modern Layouts (Grid + Flexbox)
```css
/* Auto-responsive grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

/* Sticky footer without hacks */
body {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}
```

---

## When to Choose Each Framework

**Choose Svelte if:**
- Performance is critical (smallest bundles)
- You want built-in reactivity (no useState boilerplate)
- You're building data visualizations or animations
- Team is small and doesn't need React ecosystem

**Choose React if:**
- Large team with React experience
- Need massive component library ecosystem
- Building complex state management apps
- Want maximum hiring pool

**Choose Vue if:**
- You value template syntax over JSX
- Need progressive enhancement (sprinkle into existing site)
- Want official state management (Pinia) and routing (Vue Router)
- Team prefers gradual learning curve

**Choose Vanilla if:**
- Building a library (no framework lock-in)
- Maximum performance (zero framework overhead)
- Web components or design system
- Simple static site with minimal interactivity

---

## Deployment (Vite Static)

### Build for Production
```bash
npm run build  # Creates /dist folder
```

### Preview Locally
```bash
npm run preview  # Test production build locally
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod  # Deploys /dist automatically
```

### Deploy to Netlify
```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200  # SPA fallback
```

### Deploy to GitHub Pages
```bash
# vite.config.ts
export default {
  base: '/repo-name/',  # Match GitHub repo
}

# package.json
{
  "scripts": {
    "deploy": "vite build && gh-pages -d dist"
  }
}
```

---

## Summary: The Vite Philosophy

1. **Start simple** - Pick template, install, run
2. **Stay lean** - No framework if you don't need one
3. **Optimize early** - Bundle analysis from day 1
4. **Modern CSS first** - Variables, container queries, grid
5. **TypeScript always** - Catch errors at compile time
6. **Framework pragmatism** - Svelte for perf, React for ecosystem, Vue for DX, Vanilla for control

**NEVER use Next.js. Vite covers everything you need.**
