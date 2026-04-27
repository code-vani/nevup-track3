# DECISIONS.md — NevUp Track 3: System of Engagement

## 1. Next.js 14 App Router + local API fallback
Built a `/api/local/[...path]` route implementing the full OpenAPI contract using seed CSV. The Next.js rewrite tries Prism first, falls back to local. This means the app never breaks whether Prism runs or not — no hardcoded data, all metrics computed from real CSV.

## 2. Custom SVG heatmap — no library
Spec bans off-the-shelf calendar heatmap libraries. Built in raw SVG. Color encodes two signals: hue (green=positive PnL, red=negative) and opacity (plan adherence). Keyboard-navigable via arrow keys.

## 3. SSE with exponential backoff
Chose SSE over WebSocket because coaching messages are one-directional. Custom backoff: `min(2^attempt * 1000ms, 30000ms)`. On disconnect shows "Reconnecting..." banner — not blank screen.

## 4. JWT HS256 client-side minting
Tokens minted client-side using Web Crypto API (browser) or Node crypto (server). Row-level tenancy enforced on every route — cross-tenant reads return HTTP 403 with traceId.

## 5. Seed data strategy
CSV parsed and cached in module scope. All metrics, sessions, heatmap computed from real CSV on cold start. Module cache makes subsequent requests fast.

## 6. Lighthouse ≥ 90 strategy
CSS-only animations, Google Fonts with `display=swap`, no heavy runtime animation library, code splitting per view, standalone Next.js output for minimal Docker image. `lighthouserc.js` at repo root asserts ≥ 90 on Performance, Accessibility, Best Practices across 3 runs per URL. Reproducible via `npm run lhci` (alias for `lhci autorun`). Results written to `./lhci-results/` as both JSON and HTML.

## 7. Mobile-first debrief
5-step flow designed for 375px viewport first. Focus management moves to first interactive element on step transition (350ms delay to wait for CSS animation). All buttons have aria-pressed, aria-label, focus rings.
