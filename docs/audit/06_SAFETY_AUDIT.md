# Phase 6 — Health, Safety and Trust Audit

**Audit Date:** 2026-11-20

---

## Health Claim Review

### Claims Found in Source Code

| Location | Claim | Assessment |
|----------|-------|------------|
| `engine.ts:171` | "HEPA filtration reduces indoor PM2.5 by 50-80%" | ✅ Accurate — EPA-validated range |
| `engine.ts:197` | "sealing reduces indoor levels by 30-50%" | ✅ Accurate |
| `engine.ts:208` | "Indoor sources can contribute 20-50% of total PM2.5 exposure" | ✅ Accurate |
| `engine.ts:256` | "Active commute at AQI 150 increases inhalation dose 2-5x vs rest" | ✅ Scientifically defensible |
| `orchestrator.ts:171` | "HEPA filtration reduces indoor PM2.5 by 50-80%" | ✅ |
| `impact/calculator.ts:131` | "Tree seedlings grown for 10 years = 0.06 kg CO2e" | ⚠️ Rough equivalence — varies significantly |

### No Unsupported Claims Found
All quantitative claims cite reasonable scientific basis and include `limitations` arrays.

---

## Medical Advice Audit

### Positive Findings
- AI system prompt: "NEVER give medical advice" ✅
- Fallback response: "I cannot provide medical advice. Please consult a healthcare professional." ✅
- Health section explicitly disclaims: "⚠️ I cannot provide medical advice" ✅
- Emergency guidance present: "Severe breathing difficulty, chest pain, confusion — call emergency services immediately" ✅
- No diagnosis of any condition ✅
- No claim that any action prevents specific diseases ✅
- No medication recommendations ✅

### Profile Conditions Field
- Conditions entered as free-text string (comma-separated)
- Not validated against medical terminology — a user could enter anything
- Used only to identify "respiratory" or "cardiac" conditions via keyword matching
- No inference about specific medical treatment made ✅

---

## Ventilation Safety Audit

### Indoor Ventilation Recommendations
**Found in `engine.ts:201`:**
> "Monitor indoor CO2 if sealed for >4 hours"
> "Ventilate briefly when outdoor AQI temporarily improves"
> "Never seal home with unvented combustion appliances"

**Assessment:** ✅ All three caveats are correct and important for Indian urban context (gas stoves, kerosene heaters common).

**Found in `orchestrator.ts` indoor guidance:**
> "Ventilation: Only when outdoor AQI < 50 or indoor > outdoor"
> "Best: 11 AM - 3 PM, 15-30 min cross-ventilation"

**Assessment:** ✅ Timing guidance is evidence-based (pollutants typically lower midday).

---

## Air Purifier Safety Audit

### Guidance Given
- "Choose True HEPA (H13/H14), CADR ≥ 2/3 room volume" ✅
- "Place in bedroom & living room, keep doors/windows closed" ✅
- "Filters need regular replacement" ✅

### Ozone Generators
**PASS:** No mention of ozone generators anywhere in codebase. ✅

### Ionic Purifiers
**PASS:** Not mentioned specifically. The guidance specifies "True HEPA" which correctly excludes ionizers. ✅

### Salt Lamps
**PASS:** "Salt lamps don't work" explicitly stated in AI fallback. ✅

---

## Plant Claims Audit
**Found in `orchestrator.ts:220`:**
> "Myths: Plants don't clean air"

**Assessment:** ✅ Correct — NASA Clean Air Study results have been misinterpreted; plants cannot clean air at meaningful scale in real rooms. The app correctly debunks this myth.

---

## Mask Recommendations Audit

**Found:** "wear N95/KN95" at AQI ≥ 101 for active commute; "N95/KN95 must fit properly" in limitations.

**Assessment:** ✅ Correct mask type for PM2.5. Surgical masks not recommended for PM protection — not mentioned as equivalent. Fit caveat included.

---

## Dangerous Advice Check

| Unsafe Pattern | Present? | Evidence |
|---------------|---------|---------|
| Recommend ozone generators | ❌ NOT PRESENT | ✅ Safe |
| Claim plants clean air | ❌ Explicitly debunked | ✅ Safe |
| Recommend unventilated sealing | ❌ Cautioned against | ✅ Safe |
| Recommend exercising outdoors at Hazardous AQI | ❌ Avoided | ✅ Safe |
| Give specific medication advice | ❌ NOT PRESENT | ✅ Safe |
| Claim product reduces ambient AQI | ❌ Explicitly disclaimed | ✅ Safe |
| Recommend surgical masks for PM | ❌ Specifies N95/KN95 | ✅ Safe |

**Found in `impact/calculator.ts:61`:**
> "Individual action impact on ambient AQI is negligible"

✅ Correctly sets expectations — no inflated claims about personal action changing city-wide AQI.

---

## Trust Signals

| Signal | Present |
|--------|---------|
| Data source attribution | ✅ Every AQI reading shows source |
| Demo data clearly labeled | ✅ 'demo' badge |
| Limitations disclosed with every recommendation | ✅ |
| AI response includes citations | ✅ |
| Disclaimer about medical advice | ✅ |
| Emergency services reference | ✅ |
| CO2e estimate disclaimer ("indicative only") | ✅ |

---

## Areas Needing Improvement

1. **AQI category labels**: Using US EPA labels ("Unhealthy for Sensitive Groups") instead of Indian CPCB labels ("Satisfactory", "Poor", "Very Poor") — may confuse Indian users who reference official CPCB scale
2. **PM2.5 → AQI reverse derivation in demo**: `pm25 = clampedAQI * 0.5` is a rough approximation — if users compare these PM2.5 values to official readings, they may be significantly off
3. **No disclaimer on demo data PM2.5 accuracy**: Demo PM2.5 values are derived approximations, not modeled values

---

## Safety Verdict: PASS with Minor Issues

The application does not make dangerous health claims. All recommendations are evidence-based, include limitations, and appropriately disclaim medical advice. The ozone generator, plant myth, and ventilation safety checks all pass. The main concern is AQI methodology mismatch (US EPA vs Indian CPCB) which affects thresholds — this is a data accuracy issue that indirectly affects the trustworthiness of displayed values.
