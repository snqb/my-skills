---
name: pwa
description: "Make any web app a 100% installable PWA. Covers manifest, icons, service worker, Apple meta/splash, offline, Lighthouse audit. Use when adding PWA support, fixing install prompts, or debugging Lighthouse PWA score."
---

# PWA — Progressive Web App Checklist

Everything needed for a perfect Lighthouse PWA score and real-world installability.

---

## Manifest (`manifest.webmanifest`)

Minimum viable:

```json
{
  "name": "My App",
  "short_name": "App",
  "description": "What it does in one line.",
  "id": "/",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#000000",
  "background_color": "#000000",
  "categories": ["productivity"],
  "icons": [
    { "src": "pwa-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "pwa-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "pwa-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "pwa-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Icon Rules

- **Minimum:** 192×192 + 512×512 PNG
- **Never** combine `"purpose": "any maskable"` — split into separate entries. Combined works technically but Lighthouse flags it and maskable icons need safe-zone padding that looks bad as `any`.
- **Maskable safe zone:** Content must fit in center 80% circle. Test at https://maskable.app
- **Favicon:** Also provide a 196×196 PNG favicon and 180×180 Apple touch icon separately.
- **SVG icon** (optional, best quality): `{ "src": "icon.svg", "type": "image/svg+xml", "sizes": "any" }`

### `id` Field

Set `"id": "/"` — Chrome uses this to identify the installed PWA. Without it, changing `start_url` creates a "different" app.

### `display` Options

| Value | Behavior |
|-------|----------|
| `standalone` | Looks like native app (recommended) |
| `fullscreen` | No status bar (games) |
| `minimal-ui` | Compact browser chrome |
| `browser` | Normal browser tab |

---

## HTML Head — Complete Template

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="description" content="..." />
<meta name="theme-color" content="#000000" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="App Name" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="msapplication-TileColor" content="#000000" />
<meta name="msapplication-TileImage" content="/mstile-150x150.png" />

<link rel="icon" type="image/png" sizes="196x196" href="/favicon-196.png" />
<link rel="apple-touch-icon" href="/apple-icon-180.png" />
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
<link rel="manifest" href="/manifest.webmanifest" />
```

### What Each Does

| Tag | Why |
|-----|-----|
| `viewport-fit=cover` | Enables `env(safe-area-inset-*)` for notch devices |
| `description` | Lighthouse requires it; shown in app stores |
| `theme-color` | Colors browser chrome / status bar |
| `apple-mobile-web-app-capable` | Enables Add to Home Screen on iOS |
| `apple-mobile-web-app-status-bar-style` | `black-translucent` = content under status bar |
| `apple-mobile-web-app-title` | Name shown under icon on iOS home screen |
| `mobile-web-app-capable` | Chrome legacy, still good to include |
| `mask-icon` | Safari pinned tab icon (SVG, monochrome) |

### Dark/Light Theme Color

```html
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
```

---

## Apple Splash Screens

iOS shows a splash screen when launching from home screen. Without these, users see a white flash.

Generate with https://progressier.com/pwa-icons-and-ios-splash-screen-generator or similar tools.

```html
<!-- iPhone SE / 8 -->
<link rel="apple-touch-startup-image" media="(device-width:320px) and (device-height:568px) and (-webkit-device-pixel-ratio:2)" href="/splash-640-1136.jpg" />
<link rel="apple-touch-startup-image" media="(device-width:375px) and (device-height:667px) and (-webkit-device-pixel-ratio:2)" href="/splash-750-1334.jpg" />
<!-- iPhone X / 11 Pro / 12 mini -->
<link rel="apple-touch-startup-image" media="(device-width:375px) and (device-height:812px) and (-webkit-device-pixel-ratio:3)" href="/splash-1125-2436.jpg" />
<!-- iPhone 12 / 13 / 14 -->
<link rel="apple-touch-startup-image" media="(device-width:390px) and (device-height:844px) and (-webkit-device-pixel-ratio:3)" href="/splash-1170-2532.jpg" />
<!-- iPhone 14 Pro / 15 -->
<link rel="apple-touch-startup-image" media="(device-width:393px) and (device-height:852px) and (-webkit-device-pixel-ratio:3)" href="/splash-1179-2556.jpg" />
<!-- iPhone Plus / Max -->
<link rel="apple-touch-startup-image" media="(device-width:414px) and (device-height:736px) and (-webkit-device-pixel-ratio:3)" href="/splash-1242-2208.jpg" />
<link rel="apple-touch-startup-image" media="(device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:3)" href="/splash-1242-2688.jpg" />
<link rel="apple-touch-startup-image" media="(device-width:428px) and (device-height:926px) and (-webkit-device-pixel-ratio:3)" href="/splash-1284-2778.jpg" />
<link rel="apple-touch-startup-image" media="(device-width:430px) and (device-height:932px) and (-webkit-device-pixel-ratio:3)" href="/splash-1290-2796.jpg" />
<!-- iPad -->
<link rel="apple-touch-startup-image" media="(device-width:768px) and (device-height:1024px) and (-webkit-device-pixel-ratio:2)" href="/splash-1536-2048.jpg" />
<link rel="apple-touch-startup-image" media="(device-width:810px) and (device-height:1080px) and (-webkit-device-pixel-ratio:2)" href="/splash-1620-2160.jpg" />
<link rel="apple-touch-startup-image" media="(device-width:834px) and (device-height:1112px) and (-webkit-device-pixel-ratio:2)" href="/splash-1668-2224.jpg" />
<link rel="apple-touch-startup-image" media="(device-width:834px) and (device-height:1194px) and (-webkit-device-pixel-ratio:2)" href="/splash-1668-2388.jpg" />
<link rel="apple-touch-startup-image" media="(device-width:1024px) and (device-height:1366px) and (-webkit-device-pixel-ratio:2)" href="/splash-2048-2732.jpg" />
```

**Tip:** Dark splash + app background = no flash. Use `.jpg` not `.png` (smaller).

---

## Service Worker

### Minimum Viable (Workbox)

```ts
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { createHandlerBoundToURL } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")));
```

### Registration + Update Prompt

```ts
import { registerSW } from "virtual:pwa-register";

registerSW({
  onNeedRefresh() {
    if (confirm("New version available. Reload?")) location.reload();
  },
  onOfflineReady() {
    console.log("Ready to work offline");
  },
});
```

### Runtime Caching (API calls, images)

```ts
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate, CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// Cache API responses — serve stale, revalidate in background
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new StaleWhileRevalidate({ cacheName: "api", plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 86400 })] })
);

// Cache images — cache first, expire after 30 days
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({ cacheName: "images", plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 86400 })] })
);
```

---

## vite-plugin-pwa Setup

```bash
pnpm add -D vite-plugin-pwa
pnpm add workbox-precaching workbox-routing workbox-window
```

### `injectManifest` (recommended — full control)

```ts
// vite.config.ts
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      manifest: { /* ... manifest fields ... */ },
    }),
  ],
});
```

Write your own `src/sw.ts` (see above).

### `generateSW` (zero config — less control)

```ts
VitePWA({
  strategies: "generateSW",
  registerType: "autoUpdate",
  manifest: { /* ... */ },
  workbox: {
    globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
    runtimeCaching: [
      { urlPattern: /^https:\/\/api\./, handler: "StaleWhileRevalidate", options: { cacheName: "api" } },
    ],
  },
})
```

---

## Install Prompt (A2HS)

```ts
let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallButton(); // your UI
});

async function install() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(outcome === "accepted" ? "Installed" : "Dismissed");
  deferredPrompt = null;
}

// Detect if already installed
window.addEventListener("appinstalled", () => {
  hideInstallButton();
});

// Check display mode
const isInstalled = window.matchMedia("(display-mode: standalone)").matches
  || (navigator as any).standalone === true;
```

**iOS caveat:** `beforeinstallprompt` doesn't fire on iOS. Check `navigator.standalone` and show manual "Add to Home Screen" instructions.

---

## Offline Page (optional)

For apps that can't fully work offline, serve a custom offline page:

```ts
// In sw.ts — catch navigation failures
import { setCatchHandler } from "workbox-routing";

setCatchHandler(async ({ event }) => {
  if (event.request.destination === "document") {
    return caches.match("/offline.html");
  }
  return Response.error();
});
```

Pre-cache `offline.html` in your manifest.

---

## Nginx Gotchas

```nginx
# Serve manifest with correct MIME type
location /manifest.webmanifest {
    types { application/manifest+json webmanifest; }
    expires 1d;
}

# Service worker must NOT be cached aggressively
location /sw.js {
    expires off;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}

# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|json|webmanifest)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

⚠️ The general static cache rule above would cache `sw.js` for 30 days. **Always** put the `sw.js` no-cache rule first, or exclude it from the pattern.

---

## Icon Generation

### From a single source PNG (≥ 512×512):

```bash
# Using ImageMagick
convert icon.png -resize 192x192 public/pwa-192x192.png
convert icon.png -resize 512x512 public/pwa-512x512.png
convert icon.png -resize 180x180 public/apple-icon-180.png
convert icon.png -resize 196x196 public/favicon-196.png
convert icon.png -resize 150x150 public/mstile-150x150.png

# Using sips (macOS)
sips -z 192 192 icon.png --out public/pwa-192x192.png
sips -z 512 512 icon.png --out public/pwa-512x512.png
sips -z 180 180 icon.png --out public/apple-icon-180.png
sips -z 196 196 icon.png --out public/favicon-196.png
```

### Splash screens:

Use https://progressier.com/pwa-icons-and-ios-splash-screen-generator — upload one icon, get all sizes.

Or script it:
```bash
# Dark splash: centered icon on solid background
convert -size 1170x2532 xc:#000000 icon.png -gravity center -composite splash-1170-2532.jpg
```

---

## Lighthouse PWA Audit Checklist

| Check | What |
|-------|------|
| ✅ Manifest exists | `<link rel="manifest">` in HTML |
| ✅ `name` + `short_name` | Both present in manifest |
| ✅ `start_url` | Set and reachable |
| ✅ `display: standalone` | Not `browser` |
| ✅ `theme_color` | In manifest AND `<meta name="theme-color">` |
| ✅ `background_color` | In manifest |
| ✅ 192px icon | `purpose: any` |
| ✅ 512px icon | `purpose: any` |
| ✅ Maskable icon | Separate entry with `purpose: maskable` |
| ✅ Service worker | Registered, controls the page |
| ✅ Offline response | SW returns something when offline (200) |
| ✅ HTTPS | Required for SW registration |
| ✅ Redirects to HTTPS | HTTP → HTTPS redirect |
| ✅ `<meta name="viewport">` | Present |
| ✅ `<meta name="description">` | Present |
| ✅ Apple meta tags | `apple-mobile-web-app-capable`, touch icon |

### Quick Local Audit

```bash
# Lighthouse CLI
npx lighthouse https://localhost:5173 --only-categories=pwa --view

# Or in Chrome DevTools:
# Application tab → Manifest (check all green)
# Application tab → Service Workers (check registered)
# Lighthouse tab → PWA category
```

---

## Debugging

| Problem | Fix |
|---------|-----|
| "Add to Home Screen" not showing | Check: HTTPS, manifest linked, SW registered, 192+512 icons, `display: standalone` |
| iOS: no install prompt | iOS doesn't support `beforeinstallprompt` — show manual instructions via share → Add to Home Screen |
| Stale SW after deploy | Check `sw.js` isn't cached (nginx rule). Use `skipWaiting()` + reload prompt |
| "Site cannot be installed: no matching service worker" | SW must control the page. Check `start_url` matches SW scope |
| Icons not showing | Check paths are relative to manifest location, files exist, correct MIME |
| White flash on iOS launch | Add matching `apple-touch-startup-image` splash screens |
| `purpose: "any maskable"` warning | Split into two separate icon entries |
