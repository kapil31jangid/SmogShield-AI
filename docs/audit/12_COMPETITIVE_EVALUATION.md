# Phase 12 — Competitive Evaluation

**Audit Date:** 2026-11-20  
**Rubric:** Internal engineering rubric — not official competition scoring

---

## Score Breakdown

### 1. Problem Alignment — 14/20

**Evidence:**
- Application directly addresses winter smog navigation for families ✅
- 8 Indian cities with realistic winter AQI demo values ✅
- Covers all major exposure pathways: outdoor, indoor, travel, community ✅
- Family profile system with children, elderly, respiratory conditions ✅

**Deductions:**
- AQI methodology uses US EPA breakpoints, not Indian CPCB standard (-3)
- Category labels don't match what Indian users see on official CPCB portals (-2)
- Community challenge features are simulated, not genuinely community-connected (-1)

### 2. Practical Innovation — 11/15

**Evidence:**
- Deterministic Exposure Reduction Engine is a genuine feature with technical depth ✅
- Risk multiplier system (child ×1.5, respiratory ×2.0, purifier correction) is well-engineered ✅
- Multi-provider AQI adapter pattern enables future provider switching ✅
- CADR/ACH purifier sizing calculation is technically correct ✅
- Hindi language support (bilingual fallback responses) ✅

**Deductions:**
- Gemini integration non-functional (invalid API key type) (-2)
- No novel data visualization (CSS bars, not Recharts charts) (-1)
- Community features add no real innovation (-1)

### 3. Functional Completeness — 9/15

**Evidence:**
- 7 dashboard feature pages render ✅
- AI assistant responds (via fallback) ✅
- Recommendation engine runs real calculations ✅
- Planner shows CO2e estimates ✅

**Deductions:**
- No data persistence — profiles/actions/challenges reset on refresh (-3)
- 3 of 6 API directories are empty (profiles, impact, challenges) (-2)
- WAQI provider disabled (-1)

### 4. AI Usefulness and Safety — 7/10

**Evidence:**
- System prompt correctly prevents hallucination and medical advice ✅
- Deterministic fallback is genuinely informative ✅
- Context grounding (AQI data, profiles, recommendations) in prompts ✅
- Emergency guidance present ✅

**Deductions:**
- Live Gemini unreachable (wrong key type) (-2)
- Output not schema-validated (-0.5)
- Hindi language not wired to user preference (-0.5)

### 5. Code Quality and Architecture — 7/10

**Evidence:**
- TypeScript strict mode ✅
- Zod validation at API boundaries ✅
- Adapter pattern for AQI providers ✅
- Clear lib/components/app separation ✅
- 51 unit tests passing ✅

**Deductions:**
- 41 lint warnings (unused imports, missing deps) (-1)
- 1 TypeScript error in test file (-0.5)
- .bak file committed to repo (-0.5)
- No rate limiting, no auth on write endpoints (-1)

### 6. Data Reliability — 6/10

**Evidence:**
- OpenAQ is a legitimate data source (aggregates government monitors) ✅
- Demo data clearly labeled ✅
- Fallback chain (OpenAQ → Demo) functional ✅
- 15-min cache on AQI data ✅

**Deductions:**
- US EPA AQI methodology instead of Indian CPCB — significant for Indian context (-3)
- In-memory cache unreliable on serverless (-0.5)
- WAQI disabled (-0.5)

### 7. UI/UX and Accessibility — 5/8

**Evidence:**
- Consistent design system (Tailwind + Lucide) ✅
- Dark mode support ✅
- Mobile responsive layouts ✅
- Empty states and error handling ✅
- Bilingual UI ✅

**Deductions:**
- AQI "Good" color (#00e400) fails WCAG AA contrast (-1.5)
- Charts not accessible to screen readers (-1)
- Skip-to-content link missing (-0.5)

### 8. Security and Privacy — 3/5

**Evidence:**
- No secrets in source control ✅
- Server-side API key management ✅
- Input validation with Zod ✅
- Cron endpoint protected ✅

**Deductions:**
- No authentication on AI/write endpoints (-1)
- No rate limiting (-1)

### 9. Testing and Reliability — 3/4

**Evidence:**
- 51 unit tests passing ✅
- Good coverage of core engine and calculator ✅
- Test configuration correct ✅

**Deductions:**
- E2E tests not running (require live server) (-0.5)
- Missing tests for Indian CPCB breakpoints, indoor advisor, aggregator (-0.5)

### 10. Deployment and Documentation — 1/3

**Evidence:**
- Docs suite: 8 documentation files ✅
- README with architecture overview ✅
- Deployment config ready (vercel.json) ✅

**Deductions:**
- Application NOT deployed — no live URL (-2)

---

## Total Score: **66/100**

---

## Score Interpretation

| Range | Interpretation |
|-------|---------------|
| 85–100 | Likely winner |
| 70–84 | Strong contender |
| **55–69** | **Competitive but has significant gaps** |
| 40–54 | Unlikely to place |

**SmogShield AI at 66/100 is a competitive entry with strong technical foundations but is not submission-ready due to missing deployment and data methodology issues.**

---

## Comparison to Reference Project (CuraCircle.AI)

Based on published architecture review (no source code access in this audit):

| Dimension | CuraCircle.AI | SmogShield AI |
|-----------|--------------|--------------|
| Domain specificity | Healthcare (broad) | Air quality (specific) ✅ |
| Data integration | Healthcare APIs | Environmental APIs ✅ |
| GenAI depth | Strong Gemini integration | Functional fallback; Gemini inactive |
| Persistence | Firebase Auth + Firestore | Firestore configured but not wired |
| Community features | Unknown | Simulated |
| AQI specificity | Unknown | Exists but methodology issue |

---

## Top 5 Issues Preventing Maximum Score

1. **No live deployment** — single biggest gap; mandatory for submission
2. **US EPA instead of Indian CPCB AQI** — methodological mismatch for stated Indian context
3. **No data persistence** — profiles, impact, challenges reset on every page refresh
4. **Gemini non-functional** — wrong API key type; AI experience is deterministic only
5. **No rate limiting / auth on AI endpoint** — security risk when Gemini key is active
