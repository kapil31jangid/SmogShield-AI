# Deployment Guide — SmogShield AI

## Overview

**Platform**: Vercel (recommended)
**Runtime**: Node.js 24 LTS (Fluid Compute)
**Regions**: Primary `sin1` (Mumbai) for Indian users
**Cost Target**: Free tier compatible

---

## Prerequisites

### Accounts Required
1. **Vercel** — `vercel.com` (GitHub OAuth)
2. **Firebase** — `console.firebase.google.com` (Google Cloud project)
3. **Google AI Studio** — `aistudio.google.com` (Gemini API key)
4. **OpenAQ** — `openaq.org` (optional, higher rate limits)
5. **WAQI** — `aqicn.org/api/` (optional, better Indian coverage)
6. **Brevo** — `brevo.com` (optional, email notifications)

### Local Setup
```bash
# Node.js 22+
node --version  # v22.0.0+

# Vercel CLI
npm i -g vercel

# Firebase CLI
npm i -g firebase-tools
firebase login
```

---

## Firebase Setup

### 1. Create Project
```bash
firebase projects:create smogshield-ai --display-name "SmogShield AI"
```

### 2. Enable Services
- **Authentication** → Sign-in method → Google (enable)
- **Firestore Database** → Create database → Start in production mode
- **Location**: `asia-south1` (Mumbai)

### 3. Firestore Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Challenges: public read, participants can join
    match /challenges/{challengeId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid in resource.data.participants;
    }

    // AQI cache (if used)
    match /aqi_cache/{locationId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

```bash
firebase deploy --only firestore:rules
```

### 4. Service Account
```bash
# Console → Project Settings → Service Accounts → Generate New Private Key
# Save as firebase-service-account.json
# Base64 encode for Vercel:
cat firebase-service-account.json | base64 -w0
```

---

## Vercel Deployment

### 1. Connect Repository
```bash
# In project root
vercel link
# Select existing project or create new
# Framework preset: Next.js
```

### 2. Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

| Variable | Environment | Description |
|----------|-------------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | All | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | All | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | All | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | All | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | All | Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | All | App ID |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Production | **Base64 encoded** service account |
| `GEMINI_API_KEY` | All | Google AI Studio key |
| `OPENAQ_API_KEY` | All | Optional, OpenAQ key |
| `WAQI_API_KEY` | All | Optional, WAQI key |
| `BREVO_API_KEY` | Production | Optional, Brevo API key |
| `BREVO_SENDER_EMAIL` | Production | Verified sender email |
| `CRON_SECRET` | Production | `openssl rand -hex 32` |
| `NEXT_PUBLIC_APP_URL` | Production | `https://your-domain.vercel.app` |

**Important**: `FIREBASE_SERVICE_ACCOUNT_JSON` must be **Production only** (not Preview/Development).

### 3. Deploy
```bash
# Preview deployment (auto on push)
git push origin main

# Production deployment
vercel --prod
```

### 4. Custom Domain (Optional)
```bash
vercel domains add smogshield.ai
# Configure DNS per Vercel instructions
```

---

## vercel.ts Configuration

The project uses `vercel.ts` for programmatic configuration:

```typescript
// Key settings
regions: ['sin1'],                    // Mumbai
functions: { maxDuration: 30 },       // 30s timeout
crons: [{ path: '/api/scheduler/tick', schedule: '30 0 * * *' }],  // 6:30 AM IST daily
headers: [                            // Caching
  cacheControl('/static/(.*)', { public: true, maxAge: '1 week', immutable: true }),
  cacheControl('/_next/static/(.*)', { public: true, maxAge: '1 year', immutable: true }),
]
```

---

## Post-Deployment Verification

### Automated
```bash
# Run verification script against production
VERCEL_URL=your-app.vercel.app node scripts/verify-http.mjs
```

### Manual Checklist
- [ ] **Dashboard**: Loads, shows location modal, AQI displays
- [ ] **Profiles**: Add/edit/delete works
- [ ] **Assistant**: Sends message, receives response
- [ ] **Planner**: Shows alternatives, calculates savings
- [ ] **Impact**: Logs action, shows trends
- [ ] **Challenges**: Join, view progress
- [ ] **Settings**: Theme toggle, notifications, export
- [ ] **Hindi**: `/hi/dashboard` loads, text translated
- [ ] **Mobile**: Responsive, touch targets work
- [ ] **Dark mode**: Toggle persists
- [ ] **Cron**: Check Vercel Function logs for daily tick

---

## Monitoring & Observability

### Vercel Dashboard
- **Functions**: Invocations, duration, errors
- **Analytics**: Core Web Vitals (if enabled)
- **Logs**: Real-time function logs

### Firebase Console
- **Auth**: Sign-ins, active users
- **Firestore**: Reads/writes, quota usage
- **Rules**: Evaluation stats

### Recommended Alerts
| Metric | Threshold | Action |
|--------|-----------|--------|
| Function errors | >1% for 5m | Investigate logs |
| Function duration | p99 > 10s | Optimize/timeout |
| Firestore reads | >80% quota | Add caching |
| Auth failures | Spike | Check provider status |

---

## Rollback Procedure

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]

# Or promote previous preview to production
vercel promote [preview-url]
```

---

## Cost Optimization

### Free Tier Limits (Vercel Hobby)
| Resource | Limit |
|----------|-------|
| Function invocations | 100,000/month |
| Function duration | 100 GB-hours/month |
| Bandwidth | 100 GB/month |
| Edge requests | Unlimited |

### Optimization Strategies
- **Caching**: 15-min AQI, 1-hr historical, static assets 1yr
- **ISR**: Not used (dynamic AQI)
- **Edge Functions**: Not needed (Fluid Compute sufficient)
- **Bundle size**: <150KB gzipped (monitored)

---

## Troubleshooting

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `FIREBASE_SERVICE_ACCOUNT_JSON` error | Not base64 encoded | `cat file.json \| base64 -w0` |
| AQI not loading | No API keys, demo mode | Add keys or enable demo |
| AI not responding | `GEMINI_API_KEY` missing | Add key in Vercel env |
| Cron not firing | `CRON_SECRET` mismatch | Verify in Vercel + code |
| Hindi not loading | Locale cookie | Check middleware, cookie settings |
| Build fails | TypeScript errors | Run `npm run typecheck` locally |

### Debug Commands
```bash
# View function logs
vercel logs [deployment-url] --follow

# Test API locally
vercel dev

# Pull env vars
vercel env pull .env.local

# Check Firestore rules
firebase firestore:rules:get
```

---

## Security Checklist (Post-Deploy)

- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` only in Production env
- [ ] `CRON_SECRET` set and matches code
- [ ] Firestore rules deployed and tested
- [ ] No API keys in client bundle (`NEXT_PUBLIC_*` only)
- [ ] CSP headers present (check DevTools → Network → Headers)
- [ ] Rate limiting working (test with rapid requests)
- [ ] Error pages don't leak stack traces
- [ ] `vercel.json` not exposing internal paths

---

## Scaling Considerations

### When to Upgrade
| Trigger | Action |
|---------|--------|
| Function invocations > 80k/mo | Upgrade to Pro |
| Need >30s timeout | Pro (300s max) |
| Need reserved instances | Enterprise |
| Multi-region failover | Enterprise |

### Architecture for Scale
- Add Redis (Upstash) for distributed caching
- Partition Firestore by userId (already)
- Move heavy AI to background jobs (Vercel Queues)
- CDN for static assets (already Vercel Edge)

---

## Backup & Disaster Recovery

### Firestore
- Automated daily backups (Google Cloud)
- Point-in-time recovery (7 days)
- Export: `gcloud firestore export gs://bucket`

### Vercel
- Git history = code backup
- Environment variables: Document in secure location
- Domain: DNS records documented

### RTO/RPO Targets
| Scenario | RTO | RPO |
|----------|-----|-----|
| Function failure | <5 min | 0 |
| Firestore outage | <30 min | <1 hr |
| Region failure | <1 hr | <1 hr |
| Data corruption | <4 hr | <24 hr |

---

## Support Contacts

| Service | Support |
|---------|---------|
| Vercel | Dashboard → Help (Pro+) |
| Firebase | Google Cloud Console → Support |
| Gemini AI | Google AI Studio → Help |
| OpenAQ | `community@openaq.org` |
| WAQI | `aqicn.org` contact form |