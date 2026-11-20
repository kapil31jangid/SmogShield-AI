# Phase 2 — Challenge Alignment Audit

**Audit Date:** 2026-11-20  
**Challenge:** Build a GenAI-powered assistant helping families and communities navigate severe winter smog and urban air pollution.

---

## Feature-by-Feature Classification

| Feature | Implementation Status | Evidence | Assessment |
|---------|----------------------|----------|------------|
| Live Air Quality Intelligence | **Partially implemented** | OpenAQ + WAQI providers exist and are called; Demo fallback with clear `dataFreshness: 'demo'` label | Real data depends on OpenAQ station coverage (Indian city stations vary); demo data shown when unavailable |
| AQI Dashboard | **Fully implemented** | `DashboardClient.tsx` renders AQI reading, pollutant breakdowns, freshness badge, source attribution | ✅ Strong |
| Historical AQI Trends | **Partially implemented** | `fetchHistoricalAQI()` exists; UI renders bar chart if data available | Historical endpoint returns empty array when OpenAQ has no historical coverage — no graceful fallback message |
| Family Exposure Profiles | **Partially implemented** | UI complete with CRUD modals; data not persisted to Firebase (no API route) | CRITICAL: Profiles reset on page refresh |
| AI Exposure Reduction Engine | **Fully implemented** | `engine.ts` — 358 lines of deterministic rules, AQI thresholds, profile-risk multipliers, indoor/travel/community recs | ✅ Signature feature is functional |
| GenAI Assistant | **Partially implemented** | `orchestrator.ts` integrates Gemini 1.5 Flash with deterministic fallback; API route validated with Zod | Gemini unreachable (invalid API key type); fallback works; language hardcoded to 'en' in route |
| Indoor Air Protection | **Fully implemented** | `indoor/advisor.ts` with HEPA guidance, ventilation rules, myth-busting | ✅ Well-implemented |
| Low-Emission Planner | **Fully implemented** | `planner/emissions.ts` with CO2e estimates for Indian transport modes | ✅ Covers commute, carpooling, trip-combining |
| Impact Tracker | **Partially implemented** | `calculator.ts` computes CO2e summaries, equivalencies, weekly/monthly trends | Data not persisted (useState); also uses `mockActions` for demo |
| Community Challenges | **Partially implemented** | UI shows hardcoded `mockChallenges`; no backend; participation is UI-only |
| Settings & Privacy | **Partially implemented** | Settings page exists with theme/language toggles | Preferences not persisted beyond sessionStorage |
| Hindi Language Support | **Partially implemented** | next-intl configured; translation files in public/locales; AI fallback has Hindi responses | AI route hardcodes `language: 'en'` — Hindi responses not wired to user preference |
| Emergency Guidance | **Fully implemented** | AI fallback includes emergency: "severe breathing difficulty, chest pain — call emergency services" | ✅ |
| Data Attribution | **Fully implemented** | `attribution` field on every provider; displayed in UI; "Demo Data" clearly labeled | ✅ |
| Personalized Recommendations | **Fully implemented** | Engine applies risk multipliers per profile category, conditions, commute, purifier | ✅ |

---

## Challenge Requirement Mapping

### "Help families understand severe winter smog"
**Status: Fully Addressed**
- Dashboard shows AQI category with description
- AI assistant explains what PM2.5, PM10, NO2 mean
- Demo data uses realistic Indian winter AQI values (Delhi 320, Mumbai 180)
- Educational content in indoor advisor

### "Interpret local air-quality conditions"
**Status: Partially Addressed**
- Real data from OpenAQ works for cities with monitoring stations
- Indian city demo data covers 8 major cities
- AQI calculation uses US EPA breakpoints, NOT Indian CPCB — this is a significant accuracy issue (see Phase 4)

### "Reduce personal exposure"
**Status: Fully Addressed**
- Deterministic engine provides ranked, specific recommendations
- N95/KN95 guidance at correct AQI thresholds
- Activity postponement logic for sensitive groups
- Mask-use guidance with caveats (must fit properly)

### "Improve indoor air quality"
**Status: Fully Addressed**
- `indoor/advisor.ts` is thorough and evidence-based
- HEPA purifier sizing calculation (CADR × ACH) is technically correct
- Ventilation timing guidance (outdoor AQI < indoor PM2.5)
- Myth-busting (plants, salt lamps, ozone — correctly handled)

### "Make safer travel and activity decisions"
**Status: Fully Addressed**
- Planner shows CO2e per transport mode
- Engine recommends switching walk/cycle to public transport at AQI > 150
- Car cabin filter / recirculation guidance

### "Adopt lower-emission routines"
**Status: Addressed but Persistence Missing**
- Impact calculator correctly estimates CO2e savings
- Indian-sourced emission factors (CSTEP, TERI, ICCT) cited
- Actions not persisted → no longitudinal motivation

### "Understand environmental impact of actions"
**Status: Partially Addressed**
- CO2e equivalencies calculated (trees, km driven, litres petrol)
- Limitations disclaimer present (individual action ≠ ambient AQI reduction) ✅
- No visualization of cumulative community impact

### "Receive useful AI-powered explanations"
**Status: Partially Addressed**
- Deterministic fallback is genuinely useful and contextual
- Gemini integration structured correctly but API key invalid
- Hindi responses in fallback but not activated from user preference

---

## Features That Look Impressive But Have Limited Real Value

| Feature | Concern |
|---------|---------|
| Community Challenges | Hardcoded mock data; no actual community participation; misleading implication of real community network |
| Impact Tracker CO2e | Persistent motivation requires real persistence; shows mock data on load |
| Historical AQI Chart | Often empty when OpenAQ lacks historical data; no fallback message explaining why |
| "Live" data badge | Demo data shown as "Demo" (correct) but new users may not understand significance |

---

## Overall Challenge Alignment Score: 72/100

Strong core: the deterministic engine, indoor advisor, and AQI data layer are genuinely solving the problem. The key gaps are:
1. AQI methodology mismatch (US EPA instead of Indian CPCB) for a product targeting India
2. No data persistence means the product cannot track progress over time
3. Community features are entirely simulated
