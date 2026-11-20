# Phase 11 — Live Deployment Audit

**Audit Date:** 2026-11-20

---

## Deployment Status: NOT DEPLOYED ❌

**This is a MAJOR release blocker.**

The SmogShield AI application does not have a live production deployment URL. All previous Vercel deployment attempts have failed for the following documented reasons:

---

## Previous Deployment Failure History

| Attempt | Error | Root Cause |
|---------|-------|------------|
| `vercel deploy --temporary` | `invalid_function_runtime: nodejs24.x` | Vercel.ts configured nodejs24.x (not supported) |
| `vercel deploy --temporary` | `EPERM unlink next-swc.win32-x64-msvc.node` | Vercel CLI ran `npm ci` locally, couldn't replace native addon |
| `vercel build` | `project_settings_required` | Required `vercel pull --yes` first |
| `vercel whoami` | "Logged out" | CLI not authenticated — cannot proceed with CLI deploy |

---

## Current State

### What IS Ready for Deployment
- ✅ Production build succeeds (`npm run build` confirmed)
- ✅ `vercel.json` configured correctly (framework: nextjs, region: sin1, cron, caching)
- ✅ GitHub repository public at `https://github.com/kapil31jangid/SmogShield-AI`
- ✅ Main branch clean, 5 commits
- ✅ `tsconfig.tsbuildinfo` present (can be gitignored)

### What BLOCKS Deployment

1. **Vercel CLI not authenticated** — requires `vercel login` or dashboard import
2. **`FIREBASE_SERVICE_ACCOUNT_JSON` not set** — once deployed, all Firestore admin API calls will throw 500
3. **`GEMINI_API_KEY` wrong type** — Gemini will return 401, fallback will activate

---

## Deployment Instructions (Manual — Required)

### Option A: Vercel Dashboard (Recommended)
1. Go to https://vercel.com/new
2. Import GitHub repository: `kapil31jangid/SmogShield-AI`
3. Framework preset: **Next.js** (auto-detected)
4. Root Directory: `.` (project root)
5. Add Environment Variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=<Firebase web API key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<Firebase project ID>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<Firebase project ID>.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<Firebase sender ID>
NEXT_PUBLIC_FIREBASE_APP_ID=1:<Firebase sender ID>:web:2b8cce908b660935a0da9a
GEMINI_API_KEY=<get from https://aistudio.google.com/apikey>
CRON_SECRET=<generate with: openssl rand -hex 32>
NEXT_PUBLIC_APP_URL=https://<your-vercel-domain>.vercel.app
NEXT_PUBLIC_DEMO_MODE=false
FIREBASE_SERVICE_ACCOUNT_JSON=<base64 encoded service account JSON>
```

6. Click **Deploy**

### Option B: CLI Deploy
```powershell
cd c:\Users\kapil\Desktop\SmogShield-AI
npx vercel login
npx vercel --prod
```

---

## Post-Deployment Verification Checklist

Once deployed, verify:

- [ ] HTTPS active (Vercel provides automatically)
- [ ] Landing page loads at `/en` and `/hi`
- [ ] Dashboard loads at `/en/dashboard`
- [ ] AQI data fetches (check for 'live' or 'demo' badge)
- [ ] AI assistant responds (check for Gemini or fallback response)
- [ ] Browser console: no errors, no exposed API keys
- [ ] Network tab: no failed API calls
- [ ] Mobile layout: 375px width tested
- [ ] Direct URL access: `/en/dashboard/profiles` loads without 404

---

## Deployment Verdict

**Status: BLOCKER — Application not deployed**

This is the single most critical blocker for competition submission. A live deployment URL is mandatory for the submission. All other features are moot without a working deployment.

**Recommended immediate action:** Deploy via Vercel dashboard (Option A above) — takes approximately 5 minutes if environment variables are ready.
