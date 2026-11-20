# Phase 13 — Remediation Log

**Audit Date:** 2026-11-20  
**Status:** In Progress / Batch 1 Applied & Verified

---

## Remediation Record Summary

| ID | Issue Description | Severity | Area | Status | Verification |
|---|---|---|---|---|---|
| **REM-01** | US EPA Breakpoints used for Indian PM2.5 calculation | HIGH | `src/lib/aqi/providers/base.ts` | **RESOLVED** | CPCB breakpoints implemented; Unit tests verified 51/51 |
| **REM-02** | US EPA Breakpoints used for Indian PM10 calculation | HIGH | `src/lib/aqi/providers/openaq.ts` | **RESOLVED** | CPCB PM10 breakpoints implemented; Unit tests verified |
| **REM-03** | US AQI Category Labels used instead of CPCB standards | HIGH | `src/types/index.ts` | **RESOLVED** | Updated to Good, Satisfactory, Moderate, Poor, Very Poor, Severe with accurate hex codes and medical descriptions |
| **REM-04** | TypeScript compilation error in `orchestrator.test.ts` | MEDIUM | `src/lib/ai/orchestrator.test.ts` | **RESOLVED** | Fixed mock `Location` type signature; `npm run typecheck` returned code 0 |
| **REM-05** | No rate limiting on public-facing AI endpoint | HIGH | `src/app/api/assistant/route.ts` | **RESOLVED** | Implemented IP-based token-window rate limiter (10 req/min/IP) with HTTP 429 & Retry-After |
| **REM-06** | Assistant route ignored Hindi locale preference | MEDIUM | `src/app/api/assistant/route.ts` | **RESOLVED** | Request context language extracted and passed down as `'en' \| 'hi'` |
| **REM-07** | Missing basic web security headers | MEDIUM | `vercel.json` | **RESOLVED** | Added `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy` |
| **REM-08** | Backup source file committed in tree | LOW | `src/lib/recommendations/engine.ts.bak` | **RESOLVED** | File deleted from filesystem |
| **REM-09** | Recommendation engine thresholds misaligned with CPCB | MEDIUM | `src/lib/recommendations/engine.ts` | **RESOLVED** | Adjusted category threshold from EPA 151 to CPCB 201 (Poor category start) |
| **REM-10** | Unpersisted User Profiles and missing CRUD API endpoints | CRITICAL | `src/app/api/profiles/` | **OPEN (Requires Firebase Service Account)** | Documented in deployment action list |
| **REM-11** | Production Vercel deployment not yet completed | BLOCKER | DevOps / Hosting | **OPEN (Requires user login or dashboard import)** | Step-by-step instructions provided |

---

## Detailed Item Fix Log

### 1. REM-01 & REM-02 & REM-03: Indian CPCB AQI Standardization
- **Root Cause:** Implementation copied US EPA breakpoints (0-12, 12.1-35.4, etc.) instead of Central Pollution Control Board (CPCB) standards for India.
- **Fix Applied:**
  - `BaseAQIProvider.calculateAQIFromPM25`: 0-30 (Good), 31-60 (Satisfactory), 61-90 (Moderate), 91-120 (Poor), 121-250 (Very Poor), >250 (Severe).
  - `OpenAQProvider.calculateAQIFromPM10`: 0-50 (Good), 51-100 (Satisfactory), 101-250 (Moderate), 251-350 (Poor), 351-430 (Very Poor), >430 (Severe).
  - `AQI_CATEGORIES` updated with true CPCB color banding (`#55a84f`, `#a3c853`, `#fff833`, `#f29c33`, `#e93f33`, `#af2d24`).
- **Test:** Re-ran Vitest suite (`openaq.test.ts` updated to check CPCB bounds) -> 5 passed, 51 passed.

### 2. REM-04: TypeScript Check Elimination
- **Root Cause:** Test fixture in `orchestrator.test.ts` supplied obsolete keys (`city`, `country`).
- **Fix Applied:** Changed to strict `Location` object with `id, name, lat, lon, timezone`.
- **Test:** `npm run typecheck` passes with zero errors (`tsc --noEmit` exited code 0).

### 3. REM-05 & REM-06: Assistant Rate Limiting & Localization
- **Root Cause:** Endpoint `/api/assistant` was unmetered and hardcoded to English.
- **Fix Applied:** Added in-memory map tracking IP request velocity (max 10 requests / 60 seconds). Passed language context down to `generateDailyPlan` and `generateAIResponse`.
- **Test:** Confirmed type safety and valid response payload handling.

### 4. REM-07 & REM-08: Security Headers and Repository Hygiene
- **Root Cause:** Missing modern protection headers; `.bak` file left in tree.
- **Fix Applied:** Configured global security headers in `vercel.json`; removed `src/lib/recommendations/engine.ts.bak`.
