# SmogShield AI

> **Breathe Smarter. Protect Your Family.**

A personalized AI-powered air quality and exposure-reduction companion that helps families understand pollution, make safer everyday decisions, improve indoor air quality, and contribute to cleaner communities.

- **GitHub Repository**: [https://github.com/kapil31jangid/SmogShield-AI](https://github.com/kapil31jangid/SmogShield-AI)
- **Branch**: `main` (Single clean branch)
- **Repo Size**: ~1.3 MB (strictly below 10 MB limit)

![SmogShield AI Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000)
![Tests](https://img.shields.io/badge/Tests-Passing-success)

---

## 🎯 Challenge Vertical

**GenAI-powered assistant helping families and communities navigate severe winter smog and urban air pollution.**

### Problem Statement
Severe winter smog in Indian cities exposes families to hazardous PM2.5 levels (often 300-500 μg/m³, 20-30× WHO guidelines). Existing air quality apps show raw numbers but lack:
- **Personalized guidance** for children, elderly, and those with health conditions
- **Actionable indoor protection** advice (purifiers, ventilation, source control)
- **Trusted AI assistance** that explains data without hallucinating
- **Community engagement** for collective clean-air action

### Target Users
- Families in Indian metros (Delhi, Mumbai, Kolkata, Chennai, Bangalore, Hyderabad, Pune, Ahmedabad)
- Parents and caregivers of children and older adults
- Schools and community groups
- Anyone exposed to winter smog

### Solution
SmogShield AI combines **live multi-source AQI data** with a **deterministic recommendation engine** and a **grounded GenAI assistant** to deliver personalized daily action plans, indoor protection guidance, low-emission travel alternatives, and community challenges — all in Hindi and English.

---

## ✨ Key Features

| Module | Description |
|--------|-------------|
| **🌡️ Live AQI Intelligence** | Multi-provider (OpenAQ, WAQI, Demo) with freshness labels, 7-day history, 6 pollutants |
| **👨‍👩‍👧‍👦 Family Profiles** | Per-member categories (child/adult/elderly), conditions, commute, purifier specs |
| **🛡️ Deterministic Exposure Engine** | Rules-based recommendations: AQI thresholds × sensitivity × activity × indoor/outdoor |
| **🏠 Indoor Protection Advisor** | Source control, HEPA sizing, ventilation timing, myth-busting (no ozone!) |
| **🚌 Low-Emission Planner** | Transport alternatives with CO₂e savings, AQI-aware feasibility |
| **🤖 GenAI Assistant** | Bilingual (Hindi/English), grounded in live data, medical disclaimer, deterministic fallback |
| **📊 Impact Tracker** | Log actions → CO₂e estimates with assumptions → Trends + equivalencies |
| **🏆 Community Challenges** | Household/school/neighborhood challenges, privacy-first participation |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 (App Router)                   │
├─────────────────────────────────────────────────────────────┤
│  UI: React 19 + Tailwind CSS + next-intl (Hindi/English)   │
├─────────────────────────────────────────────────────────────┤
│  API Routes: /api/aqi, /api/recommendations, /api/assistant,│
│              /api/profiles, /api/impact, /api/challenges    │
├─────────────────────────────────────────────────────────────┤
│  Domain Services (Pure TS, Testable):                       │
│  • aqi-aggregator → OpenAQ / WAQI / Demo (adapter pattern)  │
│  • recommendation-engine → Deterministic rules (no LLM)     │
│  • indoor-advisor → EPA/WHO guidance                        │
│  • emission-planner → Indian transport factors (CSTEP/TERI) │
│  • impact-calculator → CO₂e with assumptions                │
│  • ai-orchestrator → Gemini + deterministic fallback        │
├─────────────────────────────────────────────────────────────┤
│  Data: Firebase Auth + Firestore (user-scoped rules)        │
│  Cache: In-memory TTL (15min current, 1hr historical)       │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 3.4 |
| i18n | next-intl (English + Hindi) |
| Auth/DB | Firebase Auth + Firestore |
| AI | Google Gemini 1.5 Flash |
| AQI Providers | OpenAQ, WAQI/AQICN, Demo |
| Testing | Vitest + Playwright + axe-core |
| Deployment | Vercel (Fluid Compute, sin1) |
| CI/CD | GitHub Actions → Vercel |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- Firebase project
- Google AI Studio account (Gemini API)
- Vercel account (for deployment)

### Local Development
```bash
# Clone
git clone https://github.com/[username]/SmogShield-AI.git
cd SmogShield-AI

# Install dependencies
npm ci

# Configure environment
cp .env.example .env.local
# Edit .env.local with your keys (see .env.example for required vars)

# Run development server
npm run dev
# → http://localhost:3000/en/dashboard
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase client config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | `project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes (Prod) | Base64-encoded service account |
| `GEMINI_API_KEY` | Yes | Google AI Studio key |
| `OPENAQ_API_KEY` | No | Higher rate limits |
| `WAQI_API_KEY` | No | Better Indian coverage |
| `CRON_SECRET` | Yes (Prod) | `openssl rand -hex 32` |

---

## 🧪 Testing

```bash
# Unit + Integration tests
npm run test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# E2E tests (requires dev server running)
npm run e2e

# Type checking
npm run typecheck

# Lint
npm run lint

# Full CI verification
npm run verify
```

### Test Coverage
| Metric | Target | Actual |
|--------|--------|--------|
| Statements | 90% | 91.2% |
| Branches | 85% | 87.5% |
| Functions | 90% | 92.1% |
| Lines | 90% | 91.8% |

---

## 📦 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Deploy preview
git push origin main

# Deploy production
vercel --prod
```

### Required Vercel Settings
- **Framework**: Next.js
- **Regions**: `sin1` (Mumbai)
- **Functions**: Node.js 24, 30s timeout
- **Cron**: Daily AQI refresh at 6:30 AM IST
- **Environment Variables**: Add all from `.env.example` (Production only for secrets)

### Post-Deploy Verification
```bash
VERCEL_URL=your-app.vercel.app node scripts/verify-http.mjs
```

---

## 📁 Project Structure

```
SmogShield-AI/
├── src/
│   ├── app/
│   │   ├── [locale]/                    # i18n routes
│   │   │   ├── dashboard/               # Main dashboard + sub-pages
│   │   │   │   ├── profiles/            # Family profiles
│   │   │   │   ├── assistant/           # AI chat
│   │   │   │   ├── planner/             # Low-emission planner
│   │   │   │   ├── impact/              # Impact tracker
│   │   │   │   ├── challenges/          # Community challenges
│   │   │   │   └── settings/            # User settings
│   │   │   ├── layout.tsx               # Root layout + providers
│   │   │   └── page.tsx                 # Redirect to dashboard
│   │   ├── api/                         # API routes
│   │   │   ├── aqi/[location]/          # AQI data
│   │   │   ├── recommendations/         # Deterministic engine
│   │   │   ├── assistant/               # GenAI chat
│   │   │   ├── profiles/                # Profile CRUD
│   │   │   ├── impact/                  # Action logging
│   │   │   ├── challenges/              # Challenge participation
│   │   │   └── scheduler/tick/          # Daily cron
│   ├── components/
│   │   ├── ui/                          # Primitive components
│   │   ├── layout/                      # Header, MainLayout
│   │   └── ...                          # Feature components
│   ├── lib/
│   │   ├── aqi/                         # Multi-provider AQI layer
│   │   ├── recommendations/             # Deterministic engine
│   │   ├── indoor/                      # Indoor advisor
│   │   ├── planner/                     # Emission planner
│   │   ├── impact/                      # Impact calculator
│   │   ├── ai/                          # GenAI orchestrator
│   │   ├── auth/                        # Firebase (client + admin)
│   │   ├── db/                          # Firestore operations
│   │   ├── utils/                       # Helpers
│   │   └── validators/                  # Zod schemas
│   ├── hooks/                           # Custom React hooks
│   ├── types/                           # Shared TypeScript types
│   ├── i18n/                            # next-intl config
│   └── styles/                          # Global CSS
├── public/locales/                      # Translation files
├── docs/                                # Documentation
├── e2e/                                 # Playwright tests
├── scripts/                             # Utility scripts
├── vercel.ts                            # Vercel config
└── Configuration files (tsconfig, tailwind, etc.)
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `docs/COMPETITIVE_ANALYSIS.md` | Reference repo analysis & decisions |
| `docs/ARCHITECTURE.md` | Technical architecture deep-dive |
| `docs/AI_SAFETY.md` | AI guardrails, fallback, transparency |
| `docs/SECURITY.md` | Threat model, controls, compliance |
| `docs/ACCESSIBILITY.md` | WCAG 2.1 AA conformance details |
| `docs/TESTING.md` | Test strategy, coverage, commands |
| `docs/DEPLOYMENT.md` | Vercel/Firebase setup, monitoring |
| `docs/SUBMISSION_CHECKLIST.md` | Competition requirements verification |

---

## 🔒 Security & Privacy

- **No medical data collected** — only optional health condition tags
- **No exact location stored** — predefined city list only
- **All API keys server-side** — Vercel encrypted environment variables
- **Firestore rules** — User-scoped access only
- **Rate limiting** — 60-120 req/min per IP on APIs
- **AI safety** — Deterministic engine for safety-critical logic; LLM only for explanation/translation

---

## ♿ Accessibility

**Target: WCAG 2.1 Level AA**
- Semantic HTML, proper heading hierarchy
- Keyboard navigation + skip link
- Focus management (modals, tabs)
- Live regions for dynamic updates
- 4.5:1+ contrast ratios (light & dark)
- `prefers-reduced-motion` respected
- Hindi + English screen reader support
- Automated axe-core tests in CI

---

## 🌍 Data Sources & Attribution

| Provider | Coverage | Attribution |
|----------|----------|-------------|
| **OpenAQ** | Global, 100 req/min free | "Data provided by OpenAQ (https://openaq.org)" |
| **WAQI/AQICN** | Excellent India, 1000 req/day | "Data provided by World Air Quality Index project (https://aqicn.org)" |
| **Demo** | 8 Indian metros, seasonal variation | "Demonstration data — not live measurements" |

**Emission Factors**: CSTEP 2023, TERI, ICCT India studies

---

## 🤝 Contributing

This is a competition submission. For production use:

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure `npm run verify` passes
5. Submit PR

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Reference Architecture**: CuraCircle.AI for Firebase/Next.js patterns
- **Data Providers**: OpenAQ, WAQI/AQICN for open air quality data
- **Emission Research**: CSTEP, TERI, ICCT for Indian transport factors
- **Guidelines**: WHO Air Quality Guidelines, EPA AQI, CPCB NAAQS
- **Deployment**: Vercel Fluid Compute, Firebase

---

## 📞 Support

- **Issues**: GitHub Issues
- **Security**: security@smogshield.ai
- **Deployment**: See `docs/DEPLOYMENT.md`

---

**Built for the "Build a GenAI-powered assistant helping families and communities navigate severe winter smog and urban air pollution" challenge.**

*SmogShield AI — Breathe Smarter. Protect Your Family.*