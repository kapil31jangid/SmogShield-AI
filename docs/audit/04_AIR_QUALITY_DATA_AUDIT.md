# Phase 4 — Air Quality Data Audit

**Audit Date:** 2026-11-20  
**Priority:** HIGH

---

## 1. Data Providers Inspected

### Provider 1: OpenAQ
- **Identity:** OpenAQ is a non-profit open platform for air quality data aggregation from government monitors worldwide
- **Official source status:** Aggregates official government station data (CPCB for India) — ✅ acceptable
- **Endpoint used:** `https://api.openaq.org/v2/latest` and `/v2/measurements`
- **Authentication:** Works without API key; `OPENAQ_API_KEY` env var present if rate limits needed
- **Coverage for India:** Variable — CPCB stations are available for major cities but coverage is inconsistent
- **API quota:** Without key: 10 req/min; with free key: 60 req/min

### Provider 2: WAQI (World Air Quality Index)
- **Identity:** WAQI aggregates data from multiple government networks worldwide
- **Official source status:** Acceptable secondary source
- **Status:** `WAQIProvider.isConfigured()` returns `false` when `WAQI_API_TOKEN` is not set → **provider is effectively DISABLED in current deployment**
- **Impact:** Only 2-provider chain is active: OpenAQ → Demo

### Provider 3: Demo Data
- **Purpose:** Fallback when live data unavailable
- **Data freshness:** Correctly labeled `dataFreshness: 'demo'`
- **Attribution:** "Demonstration data — not live measurements" ✅
- **Generation:** Sinusoidal variation around realistic winter AQI base values
- **Risk of confusion:** UI clearly labels demo data; no live/demo masking found ✅

---

## 2. ⚠️ CRITICAL: AQI Methodology Mismatch

### Finding: US EPA AQI Breakpoints Used for Indian Context

**File:** `src/lib/aqi/providers/base.ts` → `calculateAQIFromPM25()`

**Actual breakpoints implemented (US EPA):**
```
PM2.5 0.0–12.0  μg/m³  → AQI 0–50   (Good)
PM2.5 12.1–35.4 μg/m³  → AQI 51–100 (Moderate)
PM2.5 35.5–55.4 μg/m³  → AQI 101–150 (Unhealthy for Sensitive Groups)
PM2.5 55.5–150.4 μg/m³ → AQI 151–200 (Unhealthy)
```

**Indian CPCB Standard (correct for Indian context):**
```
PM2.5 0–30   μg/m³  → AQI 0–50   (Good)
PM2.5 31–60  μg/m³  → AQI 51–100 (Satisfactory)
PM2.5 61–90  μg/m³  → AQI 101–200 (Moderate)
PM2.5 91–120 μg/m³  → AQI 201–300 (Poor)
PM2.5 121–250 μg/m³ → AQI 301–400 (Very Poor)
PM2.5 >250   μg/m³  → AQI 401+   (Severe)
```

**Impact of this mismatch:**
- A PM2.5 reading of 50 μg/m³ would show as AQI ~92 (US: Moderate) but should show as AQI ~83 (Indian: Satisfactory)
- A reading of 100 μg/m³ would show AQI ~163 (US: Unhealthy) vs AQI ~167 (Indian: Moderate) — close but categories differ
- **Category labels are also wrong**: "Good", "Moderate", "Unhealthy for Sensitive Groups" are US EPA labels; Indian CPCB uses "Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"

**Severity: HIGH** — For a product targeting Indian families, using US EPA breakpoints is methodologically incorrect and could lead to inappropriate recommendations.

**Note:** When OpenAQ returns a pre-computed `aqi` field (from their own calculation), that value is not used directly — the app re-calculates AQI from raw pollutant concentration using its own breakpoints. This means the mismatch affects all displayed AQI values.

---

## 3. PM10 Breakpoints (openaq.ts)

**US EPA PM10 breakpoints implemented:**
```
PM10 0–54 μg/m³   → AQI 0–50
PM10 55–154 μg/m³  → AQI 51–100
```

**Indian CPCB PM10 breakpoints:**
```
PM10 0–50 μg/m³   → AQI 0–50
PM10 51–100 μg/m³  → AQI 51–100
PM10 101–250 μg/m³ → AQI 101–200
PM10 251–350 μg/m³ → AQI 201–300
PM10 351–430 μg/m³ → AQI 301–400
PM10 >430 μg/m³   → AQI 401+
```

**Severity: HIGH** — Same mismatch problem for PM10.

---

## 4. NO2, O3, SO2, CO Breakpoints

The NO2, O3, SO2, CO breakpoints in `openaq.ts` match US EPA values. India's CPCB uses different units and timeframes:
- CPCB NO2: annual mean (µg/m³) basis, different breakpoints
- CPCB O3: 8-hour average (ppb), similar to EPA but category thresholds differ
- **Impact:** Secondary pollutant AQI values will be systematically misreported

---

## 5. Data Freshness and Caching

| Mechanism | Implementation | Assessment |
|-----------|---------------|------------|
| Client cache TTL | 15 min for current, 1 hour for historical | ✅ Reasonable |
| Cache implementation | In-memory `Map` in module scope | ⚠️ Resets on serverless cold start — cache effectively disabled on Vercel |
| Freshness label | `'live'`, `'cached'`, `'stale'`, `'demo'` | ✅ Correct enum |
| Next.js `revalidate: 900` | Set on OpenAQ fetch call | ✅ Additional server-side cache via Next.js ISR |
| Stale data detection | No timestamp staleness check for `'stale'` state | Missing — data is 'live' or 'cached', never promoted to 'stale' automatically |

---

## 6. Missing-Value Handling

| Scenario | Handling |
|---------|---------|
| Provider returns null | Tries next provider ✅ |
| No PM2.5 available | Falls back to dominant pollutant (max AQI from available) ✅ |
| No pollutant data at all | Returns null → next provider ✅ |
| All providers fail | API returns 503 with descriptive error ✅ |
| Demo city not in list | `fetchCurrent()` returns null for unknown location ID ✅ |

---

## 7. Demo Data Integrity

- Delhi demo base AQI = 320 (Very Unhealthy) — Realistic for winter ✅
- Variation uses `Math.sin(Date.now() / 3600000)` — produces ±15% hourly variation ✅
- PM2.5 derived from AQI as `clampedAQI * 0.5–0.6` — this is a rough approximation, not a proper reverse calculation ⚠️
- Demo `dataFreshness` correctly set to `'demo'` ✅

---

## 8. Verdict

| Check | Status |
|-------|--------|
| Provider identity | ✅ OpenAQ, WAQI, Demo — all identified |
| Official source | ✅ OpenAQ aggregates government data |
| Attribution | ✅ Each provider has attribution string |
| Demo ≠ live | ✅ Clear labeling |
| Indian CPCB AQI methodology | ❌ US EPA breakpoints used throughout |
| Indian category labels | ❌ US EPA labels used |
| WAQI provider | ❌ Disabled (no token) |
| In-memory cache serverless | ⚠️ Ineffective on serverless |
| Data fabrication | ✅ Not found — demo clearly labeled |
