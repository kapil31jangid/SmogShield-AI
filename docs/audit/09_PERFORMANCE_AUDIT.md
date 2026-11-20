# Phase 9 — Performance and Efficiency Audit

**Audit Date:** 2026-11-20  
**Method:** Code analysis + build output inspection. Lighthouse not executed (app not running).

---

## Bundle and Build Analysis

**Production build previously confirmed successful.** From `.next/` output:

```
Routes compiled:
- /_not-found
- /[locale] (landing)
- /[locale]/dashboard
- /[locale]/dashboard/assistant
- /[locale]/dashboard/challenges
- /[locale]/dashboard/impact
- /[locale]/dashboard/planner
- /[locale]/dashboard/profiles
- /[locale]/dashboard/settings
- /api/aqi/[location]
- /api/assistant
- /api/recommendations
- /api/scheduler/tick
```

All 13 routes compiled without errors ✅

---

## Dependency Weight Analysis

| Library | Bundle Impact | Notes |
|---------|-------------|-------|
| `recharts` | ~180 KB minified | Used for charts; large but widely cached |
| `lucide-react` | Tree-shakable | Only imported icons included ✅ |
| `firebase` (client) | ~100 KB | Modular imports used ✅ |
| `firebase-admin` | Server-only | Not in client bundle ✅ |
| `@google/generative-ai` | Server-only | Not in client bundle ✅ |
| `next-intl` | ~40 KB | i18n library — reasonable |
| `date-fns` + `date-fns-tz` | ~30 KB combined | Both present; minimal use suggests tree-shaking |
| `swr` | ~12 KB | Used for data fetching ✅ |
| `zod` | ~14 KB | Shared server/client ✅ |

**Concern:** `recharts` is a large dependency (Recharts = Recharts + D3 subset). The impact page uses CSS bar charts, NOT Recharts components. If Recharts is imported for the dashboard but not used in several pages, unused code may be included.

---

## Network Call Efficiency

| Call | Frequency | Caching | Assessment |
|------|-----------|---------|------------|
| OpenAQ `/latest` | Per AQI request | 15-min in-memory + Next.js `revalidate:900` | ✅ |
| OpenAQ `/measurements` | Per historical request | 1-hour in-memory | ✅ |
| Gemini API | Per assistant message | No cache | Appropriate for chat |
| Firebase Firestore | Not currently called | N/A | — |

**In-memory cache on serverless:** The `SimpleCache` module-level instance resets on cold start. On Vercel, each serverless function invocation may be a cold start. The Next.js `revalidate: 900` on the fetch call provides true server-side caching via the Data Cache — this is more reliable.

---

## Server vs. Client Rendering

| Component | Rendering | Assessment |
|-----------|----------|------------|
| Landing page | Server-rendered | ✅ |
| Dashboard layout | Server-rendered + Client hydration | ✅ |
| DashboardClient.tsx | `'use client'` | ✅ Appropriate — needs browser APIs |
| Profiles page | `'use client'` | ✅ Interactive CRUD |
| Impact page | `'use client'` | ✅ Interactive |
| API routes | Server-only | ✅ |

---

## AI Token Usage

- `maxOutputTokens: 1024` limits Gemini response length ✅
- `topK: 20, topP: 0.8, temperature: 0.3` — conservative settings reduce verbosity ✅
- Conversation history limited to 6 messages: `conversationHistory.slice(-6)` ✅
- Context prompt < 500 tokens typical (AQI + 3 profiles + 5 recommendations)
- Estimated cost per conversation: ~1,500–2,000 tokens → ~\$0.0003/message at Gemini Flash pricing ✅ Economical

---

## Image Optimization

- `lucide-react` icons are SVG (no raster images) ✅
- No `<img>` tags found in inspected components
- Next.js Image component not used (no images to optimize) ✅
- Font loaded via `next/font/google` — optimized subset loading ✅

---

## Rendering Performance Issues

1. **DashboardClient.tsx `useEffect` missing dependency:** 
   ```typescript
   useEffect(() => {
     // uses selectedLocation
   }, []); // selectedLocation not in deps — stale closure
   ```
   Lint reported: "React Hook useEffect has a missing dependency: selectedLocation." This means AQI does not auto-refresh when location changes without page reload.

2. **Impact chart CSS bars:** `style={{ height: '${height}%' }}` is calculated correctly but all bars re-render on any state change — could use `useMemo` for `maxVal` calculation.

3. **`confirm()` dialog in delete handlers:** Blocks the main thread briefly — acceptable for low-frequency actions.

---

## Third-Party Scripts

No third-party analytics scripts, ad scripts, or tracking pixels found. ✅

---

## Caching Headers

```json
"/_next/static/(.*)": "Cache-Control: public, max-age=31557600, immutable"
```
✅ Static assets aggressively cached (1 year). Appropriate for Next.js content-hashed assets.

---

## Performance Verdict

| Category | Assessment |
|----------|------------|
| Bundle size | Reasonable; Recharts may add unused weight |
| API caching | Good (Next.js revalidate); in-memory cache unreliable on serverless |
| Image optimization | Excellent (no rasters) |
| AI token efficiency | ✅ Conservative limits |
| Rendering | Mostly appropriate; `useEffect` dep array bug causes stale data |
| Cold start impact | Low — Next.js App Router + Vercel optimizes cold starts |

**Estimated Time to Interactive (Lighthouse estimate):** Without measurement, Next.js 15 App Router with `'use client'` boundaries should achieve < 3s TTI on a typical connection. Recharts is the largest concern.
