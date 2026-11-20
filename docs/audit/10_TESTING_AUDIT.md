# Phase 10 — Testing Audit

**Audit Date:** 2026-11-20

---

## Test Execution Results (Verified — Run 2026-11-20T16:04:24)

```
 RUN  v2.1.5 C:/Users/kapil/Desktop/SmogShield-AI

 ✓ src/lib/aqi/providers/openaq.test.ts (5 tests) 15ms
 ✓ src/lib/recommendations/engine.test.ts (11 tests) 25ms
 ✓ src/lib/utils/helpers.test.ts (17 tests) 144ms
 ✓ src/lib/ai/orchestrator.test.ts (5 tests) 18ms
 ✓ src/lib/impact/calculator.test.ts (13 tests) 133ms

 Test Files  5 passed (5)
      Tests  51 passed (51)
   Duration  6.74s
```

✅ **All 51 unit tests PASS.**

---

## TypeScript Check (Verified)

```
src/lib/ai/orchestrator.test.ts(11,46): error TS2353: Object literal may only specify known properties, 
and 'city' does not exist in type 'Location'.
```

⚠️ **1 TypeScript error in test file.** The `Location` type requires `id, name, lat, lon, timezone` — a test fixture uses `city` which is not a valid field. Tests still pass because Vitest runs TS with looser checking.

**Fix required:** Update orchestrator.test.ts fixture to use correct `Location` shape.

---

## Lint Results (Verified from prior session)

- **41 lint warnings** across 15 files
- Warnings include: unused imports, unused variables, missing useEffect dependencies
- No lint errors (warnings don't block build)
- **Most impactful:** `react-hooks/exhaustive-deps` warnings for `useEffect` in `DashboardClient.tsx`

---

## E2E Test Results

**11 Playwright tests in `e2e/dashboard-new.spec.ts` — ALL FAILED**

```
test-results/dashboard-new-Dashboard-allows-selecting-a-location-chromium/test-failed-1.png
test-results/dashboard-new-Dashboard-shows-recommendations-chromium/test-failed-1.png
... (11 failures)
```

**Root cause:** E2E tests require a running Next.js development server. Tests were run without `npm run dev` or against a production URL. E2E configuration in `playwright.config.ts` likely points to `http://localhost:3000` which was not running during test execution.

**This is expected behavior** — E2E tests cannot run without a live server. The tests themselves may be valid.

---

## Unit Test Quality Assessment

### `openaq.test.ts` (5 tests)
- Tests: provider configuration, URL construction, response parsing
- **Positive:** Tests verify error handling (null return on empty results) ✅
- **Gap:** No test for rate-limiting (429 response) behavior
- **Gap:** No test for malformed API response (unexpected JSON structure)

### `engine.test.ts` (11 tests)
- Tests: threshold triggers (AQI 100, 150, 200), profile risk (child, respiratory), indoor conditions, travel patterns
- **Positive:** Comprehensive coverage of main engine rules ✅
- **Gap:** No test for edge case: empty profiles array
- **Gap:** No test for maximum AQI (500) handling

### `helpers.test.ts` (17 tests)
- Tests: `generateId`, `formatAQI`, `formatTimestamp`, `calculateCO2eSavings`, `getAQIColor`, `clamp`, `roundToDecimal`
- **Positive:** Broad utility coverage ✅
- **Gap:** `calculateCO2eSavings` tested for `carpool` type — not all 6 action types tested

### `orchestrator.test.ts` (5 tests)
- Tests: Gemini key absent → fallback, AQI context response, indoor query, medical disclaimer, missing context
- **Positive:** Key safety tests: medical disclaimer present, AQI data not invented ✅
- **Issue:** TypeScript error in fixture (city vs id/name)
- **Gap:** Hindi language path not tested

### `calculator.test.ts` (13 tests)
- Tests: summary calculation, weekly/monthly trends, equivalencies, estimateActionImpact
- **Positive:** CO2e calculation verification ✅
- **Gap:** No test for empty actions array (edge case)

---

## Missing Test Coverage

| Feature | Coverage | Priority |
|---------|---------|---------|
| Indian CPCB AQI breakpoints | ❌ No test for PM2.5 breakpoints | HIGH |
| Demo provider data freshness | ❌ | MEDIUM |
| WAQI provider | ❌ No tests | MEDIUM |
| Aggregator fallback chain | ❌ No integration test | HIGH |
| Zod schema validation | ❌ No tests for invalid inputs | MEDIUM |
| `indoor/advisor.ts` | ❌ No tests | HIGH |
| `planner/emissions.ts` | ❌ No tests | MEDIUM |
| `db/operations.ts` | ❌ No tests (Firebase mocking needed) | MEDIUM |
| UI components | ❌ No React Testing Library tests | LOW |
| API routes | ❌ No integration tests | HIGH |

---

## Test Infrastructure

| Tool | Status |
|------|--------|
| Vitest 2.1.5 | ✅ Configured and working |
| jsdom environment | ✅ Setup in vitest.config.ts |
| @testing-library/react | ✅ Installed but not used |
| Playwright 1.48.2 | ✅ Installed; E2E specs exist |
| msw 2.5.0 | ✅ Installed; not used in current tests |
| Coverage (@vitest/coverage-v8) | ✅ Available via `npm run test:coverage` |

---

## Recommendations

1. **Fix TypeScript error in orchestrator.test.ts** — use correct Location shape
2. **Add Indian CPCB breakpoint tests** — verify PM2.5 → AQI mapping for key values
3. **Add aggregator fallback chain test** — mock OpenAQ failure, verify WAQI tried, then Demo
4. **Add indoor advisor tests** — particularly for HEPA sizing calculation
5. **Configure E2E to run against localhost** — requires `webServer` config in playwright.config.ts
6. **Run coverage report** — establish baseline before remediation
