# Phase 1 — Repository and Project Audit

**Audit Date:** 2026-11-20  
**Auditor Role:** Independent Senior Software Auditor  
**Project:** SmogShield AI v1.0.0

---

## 1. Directory Structure

```
SmogShield-AI/
├── docs/                   ✅ Full documentation suite
├── e2e/                    ✅ Playwright E2E specs (5 files)
├── public/                 ✅ Static assets (locale JSON files)
├── scripts/                ✅ verify-http.mjs
├── src/
│   ├── app/
│   │   ├── [locale]/       ✅ Next.js App Router with i18n
│   │   │   ├── dashboard/  ✅ 7 dashboard sub-pages
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── api/
│   │       ├── aqi/[location]/route.ts   ✅
│   │       ├── assistant/route.ts        ✅
│   │       ├── recommendations/route.ts  ✅
│   │       ├── scheduler/tick/route.ts   ✅
│   │       ├── challenges/              ⚠️ EMPTY — no route.ts
│   │       ├── impact/                  ⚠️ EMPTY — no route.ts
│   │       └── profiles/               ⚠️ EMPTY — no route.ts
│   ├── components/
│   │   ├── ui/             ✅ 10 UI primitives
│   │   └── layout/         ✅ Header, MainLayout
│   ├── lib/
│   │   ├── ai/             ✅ Gemini orchestrator + fallback
│   │   ├── aqi/            ✅ Multi-provider + cache + aggregator
│   │   ├── auth/           ✅ Firebase Admin + Client
│   │   ├── db/             ✅ Firestore CRUD operations
│   │   ├── impact/         ✅ CO2e calculator
│   │   ├── indoor/         ✅ Indoor air advisor
│   │   ├── planner/        ✅ Emissions planner
│   │   ├── recommendations/✅ Deterministic engine
│   │   ├── utils/          ✅ Helpers
│   │   └── validators/     ✅ Zod schemas
│   ├── middleware.ts        ⚠️ i18n only — NO rate limiting
│   └── types/index.ts      ✅ Comprehensive type definitions
├── .gitignore              ✅ .env excluded
├── firebase.json           ✅
├── vercel.json             ✅
├── next.config.ts          ✅
├── tsconfig.json           ✅ strict mode
└── vitest.config.ts        ✅
```

---

## 2. Package Dependencies

| Package | Version | Assessment |
|---------|---------|------------|
| next | 15.1.0 | ✅ Current stable |
| typescript | 5.7.3 | ✅ Current |
| firebase | 11.0.2 | ✅ Current |
| firebase-admin | 13.0.2 | ✅ Current |
| @google/generative-ai | 0.21.0 | ✅ Current |
| zod | 3.23.8 | ✅ |
| next-intl | 3.25.0 | ✅ |
| recharts | 2.13.3 | ✅ |
| swr | 2.2.5 | ✅ |
| @vercel/config | ^0.15.0 | ⚠️ Dev dep only, used in deleted vercel.ts |
| date-fns + date-fns-tz | 4.1.0, 3.2.0 | ⚠️ Both present but minimal use |

**No critical vulnerability observed in dependencies.** `npm audit` not executed; recommend running post-deployment.

---

## 3. Missing Files — CRITICAL

| Path | Impact |
|------|--------|
| `src/app/api/profiles/route.ts` | **CRITICAL** — Profiles CRUD API missing; UI uses in-memory mock only |
| `src/app/api/impact/route.ts` | **HIGH** — Impact tracking API missing; UI uses in-memory mock only |
| `src/app/api/challenges/route.ts` | **HIGH** — Challenges API missing; UI uses in-memory mock only |
| Firebase service account env | **CRITICAL** — `FIREBASE_SERVICE_ACCOUNT_JSON` not set → all API routes needing admin SDK throw 500 |
| Valid Gemini API key | **HIGH** — `GEMINI_API_KEY` in `.env.local` is a Vertex AI ADC key (401 Unauthorized), not a Generative Language API key |

---

## 4. Stale / Problematic Files

| File | Issue |
|------|-------|
| `src/lib/recommendations/engine.ts.bak` | Backup file committed to repo — should be in .gitignore |
| `tsconfig.tsbuildinfo` | Build artifact present in repo root (should be gitignored) |
| `src/app/assistant/`, `src/app/dashboard/`, etc. | Empty directories under `src/app/` (non-locale) — dead code directories |
| `src/components/assistant/`, `src/components/challenges/`, `src/components/dashboard/`, `src/components/impact/`, `src/components/planner/`, `src/components/profiles/` | All empty component directories |
| `src/hooks/` | Empty directory |

---

## 5. Dead Code / Unused Imports

Extensive lint warnings verified in the previous session's system message. Key categories:

- **Unused component imports** in 8 dashboard pages (Modal, Clock, AlertCircle, cn, CardHeader, etc.)
- **Unused state variables** (`editingAction` in impact/page.tsx, `locale` in DashboardClient.tsx)
- **Unused lib functions** (`generateAIResponse`, `generateDailyPlan` in DashboardClient.tsx — imported but never called from UI)
- **Unused type imports** in recommendations engine
- **SchemaType import** in orchestrator.ts
- `DemoProvider` unused in aggregator.ts (instance used, class import not needed)

---

## 6. Architecture Assessment

### Strengths
- **Adapter-based AQI layer**: OpenAQ → WAQI → Demo fallback chain is well-designed and extensible
- **TypeScript strict mode**: All types are properly declared
- **Zod validation**: Input validated at every API boundary
- **Separation of concerns**: business logic (lib/) clearly separated from UI (components/) and routes (app/api/)
- **15-minute server-side cache** on AQI data reduces API hammering

### Weaknesses
- **No rate limiting**: `middleware.ts` only contains next-intl routing — no IP-based rate limiting on `/api/assistant` (high token cost)
- **In-memory cache on server**: `SimpleCache` in `aggregator.ts` is a module-level instance — resets on serverless cold start, defeating 15-min cache intent
- **Missing API routes**: Three feature areas (profiles, impact, challenges) have empty API directories with no route handlers; all persistence is client-side `useState`
- **No authentication layer**: API routes accept any request without authentication — no Firebase Auth token verification on write endpoints
- **No CORS configuration**: API endpoints lack CORS headers

---

## 7. Environment Variables

| Variable | Status | Risk |
|----------|--------|------|
| NEXT_PUBLIC_FIREBASE_* (6 vars) | ✅ Set in .env.local | NEXT_PUBLIC_ vars exposed to client — expected for Firebase |
| GEMINI_API_KEY | ⚠️ Wrong key type | AI falls back to deterministic — functional but Gemini unreachable |
| FIREBASE_SERVICE_ACCOUNT_JSON | ❌ Not set | Admin SDK throws on any API call needing Firestore write |
| CRON_SECRET | ✅ Set | Cron endpoint protected |
| NEXT_PUBLIC_APP_URL | ❌ Not set | verify-http.mjs will fail |
| OPENAQ_API_KEY | ❌ Not set | Falls back to anonymous (lower rate limits) |
| WAQI_API_TOKEN | ❌ Not set | WAQI provider disabled (not configured) |

---

## 8. GitHub / Git State

- **Repository:** `kapil31jangid/SmogShield-AI` — public ✅
- **Branch count:** 1 (`main`) ✅
- **Commits:** 5 commits with meaningful messages ✅
- **Repo size (source):** ~285 KB pack objects — well under 10 MB ✅
- **Secrets in history:** `.env` and `.env.local` correctly excluded; no API keys found in committed files ✅

---

## 9. Configuration Files

- **`next.config.ts`**: Standard Next.js config with next-intl plugin
- **`vercel.json`**: Correctly specifies `nextjs` framework, `sin1` region, cron job, static caching headers — no runtime override → Vercel will auto-detect Node
- **`firebase.json`**: Minimal Firestore-only config
- **`.firebaserc`**: Points to `smogshield-ai-kapil` project ✅
- **`tsconfig.json`**: Strict mode, path aliases (`@/*`) configured ✅

---

## 10. Summary Findings

| Category | Status |
|----------|--------|
| Directory structure | ✅ Well-organized |
| TypeScript | ✅ Strict, 1 minor error in test file |
| Unused code | ⚠️ Moderate — lint warnings throughout |
| Missing API routes | ❌ 3 of 6 feature APIs missing |
| Authentication | ❌ No server-side auth on API routes |
| Rate limiting | ❌ Not implemented |
| Firebase Admin | ❌ No service account configured |
| Gemini API | ❌ Invalid key type |
| Git hygiene | ⚠️ .bak file committed |
| Repo size | ✅ Under 10 MB |
| Branch count | ✅ Exactly 1 |
