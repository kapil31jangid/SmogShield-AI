# Security Architecture — SmogShield AI

## Threat Model

### Assets to Protect
1. **User Data**: Profiles, health conditions, location, actions, conversations
2. **API Keys**: Firebase, Gemini, OpenAQ, WAQI, Brevo
3. **Application Integrity**: Code, dependencies, build pipeline
4. **Availability**: DDoS resistance, graceful degradation

### Threat Actors
- **External Attackers**: Credential stuffing, API abuse, injection attacks
- **Malicious Users**: Data exfiltration, privilege escalation, DoS
- **Supply Chain**: Compromised dependencies, malicious packages
- **Insider**: Accidental exposure, misconfiguration

---

## Security Controls by Layer

### 1. Network & Infrastructure (Vercel)

| Control | Implementation |
|---------|----------------|
| TLS | Automatic HTTPS via Vercel; HSTS enabled |
| DDoS Protection | Vercel Edge Network + Cloudflare-level protection |
| WAF | Vercel Firewall rules (rate limiting, geo-blocking) |
| Edge Caching | Static assets cached at edge; API responses cached per config |
| Regions | Primary: Mumbai (sin1) for Indian users |

### 2. Application Security (Next.js)

#### Authentication (Firebase Auth)
```typescript
// Server-side token verification only
const { auth } = getFirebaseAdmin();
const decodedToken = await auth.verifyIdToken(sessionCookie);
// Browser SDK only for sign-in flow
```

- Google OAuth only (no passwords stored)
- HttpOnly, Secure, SameSite=Strict cookies
- Short-lived ID tokens (1hr), refresh via refresh tokens
- Admin SDK never exposed to client

#### Authorization (Firestore Rules)
```javascript
// Example: Users only access own data
match /users/{userId}/profiles/{profileId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
match /challenges/{challengeId} {
  allow read: if true;  // Public read
  allow write: if request.auth != null && request.auth.uid in resource.data.participants;
}
```

#### Input Validation (Zod)
```typescript
// Every API route validates input
const recommendationsRequestSchema = z.object({
  locationId: z.string().min(1),
  profileIds: z.array(z.string()).optional(),
  activityIds: z.array(z.string()).optional(),
});
```

#### Output Encoding
- React auto-escapes JSX
- JSON responses: `Content-Type: application/json`
- No `dangerouslySetInnerHTML` used

#### Security Headers (Next.js Config)
```typescript
headers: [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  // CSP via middleware for dynamic policies
]
```

### 3. API Security

#### Rate Limiting
| Endpoint | Limit |
|----------|-------|
| `/api/aqi/*` | 120 req/min/IP |
| `/api/assistant` | 60 req/min/IP |
| `/api/recommendations` | 60 req/min/IP |
| `/api/scheduler/tick` | CRON_SECRET only |

#### Secrets Management
```bash
# All secrets in Vercel Environment Variables (encrypted at rest)
# Client-safe: NEXT_PUBLIC_* only for Firebase config
# Server-only: FIREBASE_SERVICE_ACCOUNT_JSON, GEMINI_API_KEY, etc.
```

- `.env.example` with placeholders only
- `.gitignore` excludes `.env*`
- Vercel CLI: `vercel env pull` for local development

#### CORS Policy
```typescript
// API routes: Same-origin by default
// No wildcard origins; explicit allowlist if needed
```

### 4. Data Security

#### Encryption
| State | Method |
|-------|--------|
| In Transit | TLS 1.3 (Vercel + Firebase) |
| At Rest | Firebase (Google Cloud KMS), Firestore encryption |
| Backups | Automated, encrypted |

#### Data Minimization
- Only collect: name, category, conditions (optional), preferences
- No: exact address, phone, email (beyond auth), SSN, medical records
- Location: city-level only (predefined list)

#### Retention
| Data Type | Retention |
|-----------|-----------|
| Profiles | Until user deletion |
| Actions | 2 years (configurable) |
| Conversations | Until user deletion |
| AQI Cache | 1 hour (historical), 15 min (current) |

#### Deletion
- User-initiated: Cascade delete via Firebase Functions
- Admin: Firebase Console or Admin SDK
- GDPR/India DPDP: 30-day fulfillment target

### 5. Dependency Security

#### Supply Chain
```json
// package.json: Exact versions, no ranges for critical deps
"dependencies": {
  "next": "15.1.0",
  "firebase": "11.0.2",
  // ...
}
```

#### Scanning
- `npm audit` in CI
- Dependabot alerts enabled
- `npm audit signatures` for integrity
- No `postinstall` scripts from untrusted packages

#### Allowed Registries
- npmjs.org only
- No private registries without review

### 6. CI/CD Security

#### Pipeline (GitHub Actions → Vercel)
```yaml
# .github/workflows/ci.yml
- npm ci          # Clean install, exact versions
- npm run lint    # ESLint security rules
- npm run typecheck  # TypeScript strict mode
- npm run test    # Unit + integration tests
- npm run build   # Production build verification
- npx playwright test  # E2E tests
```

#### Deployment
- Preview deployments for every PR
- Production only from `main` branch
- Vercel: `vercel --prod` requires explicit approval
- Environment variables: Preview vs Production separation

### 7. Monitoring & Incident Response

#### Logging
| What | Where |
|------|-------|
| API requests | Vercel Logs (structured JSON) |
| Errors | Vercel + Sentry (if configured) |
| Auth events | Firebase Auth logs |
| Firestore | Audit logs (Google Cloud) |

#### Alerts (Recommended)
- Error rate > 1% for 5 min
- API latency p99 > 5s
- Auth failure spike
- Firestore quota > 80%
- Secret rotation needed

#### Incident Response Plan
1. **Detect**: Alert fires or user report
2. **Triage**: Severity (SEV-1 to SEV-3)
3. **Contain**: Disable feature, rotate keys, block IP
4. **Eradicate**: Deploy fix, patch vulnerability
5. **Recover**: Verify, monitor, restore
6. **Postmortem**: Blameless, action items

---

## Security Checklist (Pre-Deploy)

- [ ] All secrets in Vercel (not `.env.local`)
- [ ] `.env.local` in `.gitignore`
- [ ] Firestore rules tested (`firebase firestore:rules:test`)
- [ ] Rate limiting configured on all APIs
- [ ] CSP headers tested
- [ ] Dependencies scanned (`npm audit`)
- [ ] Penetration test basics (OWASP Top 10)
- [ ] Error pages don't leak stack traces
- [ ] Admin SDK only in server code
- [ ] No `console.log` of secrets/PII
- [ ] Backup/restore tested
- [ ] Incident runbook accessible

---

## Vulnerability Disclosure

**Responsible Disclosure**: security@smogshield.ai
- PGP key: [link]
- Response within 48 hours
- Fix timeline: Critical 72h, High 1 week, Medium 2 weeks
- Public disclosure after fix + 30 days

---

## Compliance

| Standard | Status |
|----------|--------|
| OWASP ASVS Level 1 | Target |
| GDPR (EU) | Architecture compliant |
| India DPDP Act 2023 | Architecture compliant |
| SOC 2 Type II | Vercel certified |
| ISO 27001 | Vercel certified |

---

## Security Contacts

- **Security Team**: security@smogshield.ai
- **Vercel Support**: Via dashboard (Enterprise)
- **Firebase Support**: Google Cloud Console
- **Emergency**: Rotate keys immediately via Vercel/Firebase consoles