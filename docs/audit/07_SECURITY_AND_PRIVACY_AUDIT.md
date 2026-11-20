# Phase 7 — Security and Privacy Audit

**Audit Date:** 2026-11-20

---

## Secret Management

| Variable | Storage | Committed? | Assessment |
|----------|---------|-----------|------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `.env.local` | No | ✅ Not in git; NEXT_PUBLIC_ exposed to client by design (Firebase web SDK requires this) |
| `GEMINI_API_KEY` | `.env.local` | No | ✅ Server-only; not in git |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Not set | N/A | ✅ Correctly excluded; though service account not configured at all |
| `CRON_SECRET` | `.env.local` | No | ✅ |

**Git history check:** `.env` and `.env.local` correctly in `.gitignore`. No API keys found in committed files.

**Risk:** `NEXT_PUBLIC_FIREBASE_API_KEY` and other Firebase NEXT_PUBLIC_ vars are intentionally client-exposed. Firebase security depends on Firestore Security Rules, NOT on API key secrecy. ✅

---

## API Authentication and Authorization

### Findings — CRITICAL

**All API routes (`/api/assistant`, `/api/aqi`, `/api/recommendations`, `/api/scheduler/tick`) have NO authentication.**

Any unauthenticated request can:
- Call `/api/assistant` and generate Gemini responses (token cost abuse if Gemini key was valid)
- Call `/api/aqi/[location]` and query OpenAQ on behalf of the app (rate limit abuse)

| Route | Auth Required? | Auth Implemented? | Severity |
|-------|---------------|------------------|---------|
| POST `/api/assistant` | Yes (token cost) | ❌ No | HIGH |
| GET `/api/aqi/[location]` | Moderate | ❌ No | MEDIUM |
| GET `/api/recommendations` | Yes (profile data) | ❌ No | HIGH |
| GET `/api/scheduler/tick` | Yes (cron only) | ✅ Checks `CRON_SECRET` header | LOW |

**Scheduler protection found in `src/app/api/scheduler/tick/route.ts`:**
```typescript
const authHeader = request.headers.get('Authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```
✅ Cron endpoint is correctly protected.

---

## Rate Limiting

**Finding: NO rate limiting implemented.**

`middleware.ts` contains only next-intl i18n routing. No IP-based, session-based, or token-bucket rate limiting exists on any API route.

**Risk:** `/api/assistant` can be called in a loop, consuming AI API tokens. When a valid Gemini key is configured, this becomes a HIGH severity financial/availability risk.

**Severity: HIGH** — Requires fix before production deployment with valid Gemini key.

---

## Input Validation

| Endpoint | Validation | Assessment |
|---------|-----------|------------|
| POST `/api/assistant` | Zod schema: message 1-1000 chars | ✅ |
| GET `/api/aqi/[location]` | Zod schema: locationId, lat/lon ranges | ✅ |
| POST `/api/recommendations` | Zod schema: locationId required | ✅ |
| Profile CRUD | No server-side endpoint exists | ❌ N/A |

---

## Output Sanitization

- API responses are JSON-serialized via `NextResponse.json()` — no HTML injection risk in JSON ✅
- AI response text is returned as-is to client — if rendered as HTML via `dangerouslySetInnerHTML`, XSS risk exists
- **Inspection of `assistant/page.tsx`:** Chat messages rendered via JSX text nodes (not innerHTML) ✅ — No XSS risk

---

## Database Security

### Firebase Client SDK
- Firestore is not currently used by any page (profiles, impact, challenges use in-memory state)
- Firebase security rules not inspected (not in repository)
- **Recommendation:** Verify Firebase security rules prevent public read/write

### Firebase Admin SDK
- `getFirebaseAdmin()` correctly reads `FIREBASE_SERVICE_ACCOUNT_JSON` from env ✅
- **Issue:** `FIREBASE_SERVICE_ACCOUNT_JSON` not configured → all admin operations throw → 500 errors on any API route that calls `getAdminDb()`
- Currently only `api/scheduler/tick` and `api/recommendations` use admin SDK; both would 500 in production

---

## Security Headers

**Found in `vercel.json`:**
```json
"headers": [
  { "source": "/static/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=604800, immutable"}] },
  { "source": "/_next/static/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=31557600, immutable"}] }
]
```

**Missing security headers:**
- `Content-Security-Policy` — not set
- `X-Frame-Options` — not set (clickjacking risk)
- `X-Content-Type-Options: nosniff` — not set
- `Referrer-Policy` — not set
- `Permissions-Policy` — not set
- `Strict-Transport-Security` — not set (Vercel adds this automatically for HTTPS)

**Severity:** MEDIUM — Next.js/Vercel provides some baseline protections, but explicit CSP is missing.

---

## CORS

No explicit CORS configuration found. Next.js API routes by default do not set CORS headers. This prevents cross-origin browser requests but also means third-party integrations would fail without CORS config. For a web app calling its own API: ✅ acceptable.

---

## Sensitive Data Storage

- Profiles stored in React state only (no localStorage, no Firestore) — data cleared on refresh ✅ from privacy perspective but functional gap
- No PII logged in console.error statements (location names and AQI values only) ✅
- No password storage, no cookie-based sessions ✅

---

## Dependency Vulnerabilities

`npm audit` not executed in this audit. Recommended to run before submission:
```
npm audit --audit-level=moderate
```

Dependencies include `firebase-admin 13.0.2`, `@google/generative-ai 0.21.0` — both recent releases unlikely to have known CVEs.

---

## Privacy Assessment

| Privacy Concern | Status |
|----------------|--------|
| PII collection | Minimal: name, health conditions (optional, free-text) |
| Data storage | No server-side persistence currently |
| Analytics | None implemented |
| Third-party trackers | None found |
| Data retention policy | Not documented (should be in privacy policy) |
| GDPR/IT-ACT compliance | No explicit data processing documentation |

---

## Classification Summary

| Finding | Severity |
|---------|---------|
| No authentication on write APIs | HIGH |
| No rate limiting on AI endpoint | HIGH |
| Missing security headers (CSP, X-Frame-Options) | MEDIUM |
| Firebase Admin SDK throws when no service account | HIGH (ops) |
| Prompt injection risk (minimal) | LOW |
| No privacy policy in app | MEDIUM |
| npm audit not run | MEDIUM (precautionary) |
