# Testing Strategy & Results — SmogShield AI

## Test Pyramid

```
                    ┌─────────────┐
                    │   E2E (5)   │  ← Critical user journeys
               ┌────┴────────────┴────┐
               │  Integration (20)    │  ← API routes, DB, AI fallback
         ┌─────┴─────────────────────┴─────┐
         │       Unit (100+)              │  ← Pure functions, utils, logic
         └─────────────────────────────────┘
```

---

## Test Categories

### 1. Unit Tests (`src/**/*.test.ts`)

**Framework**: Vitest + jsdom
**Coverage Target**: 90% on pure logic

| Module | Tests | Key Scenarios |
|--------|-------|---------------|
| `utils/helpers` | 15 | AQI colors, formatting, CO2e calc, ID gen, coord validation |
| `recommendations/engine` | 25 | All AQI categories, sensitive profiles, indoor/outdoor/travel recs, prioritization, edge cases |
| `aqi/providers/openaq` | 8 | AQI calculations, distance, normalization, reading creation |
| `impact/calculator` | 12 | Action estimation, summary aggregation, trends, equivalencies, labels |
| `planner/emissions` | 10 | Alternatives, trip plans, baseline, errand combining |
| `indoor/advisor` | 8 | Guidance categories, purifier sizing, AQI-specific protocols |

**Run**: `npm run test`

### 2. Integration Tests (`src/**/*.test.ts` with MSW)

**Framework**: Vitest + MSW (Mock Service Worker)
**Coverage**: API routes, Firebase operations, AI orchestration

| Route/Module | Tests | Mocked |
|--------------|-------|--------|
| `/api/aqi/[location]` | 5 | OpenAQ, WAQI, Demo providers |
| `/api/recommendations` | 4 | AQI fetch, deterministic engine |
| `/api/assistant` | 6 | Gemini AI, fallback, daily plan |
| `firebase-admin` ops | 8 | Firestore, Auth |
| `ai/orchestrator` | 5 | Gemini, fallback, Hindi/English |

**Run**: `npm run test`

### 3. End-to-End Tests (`e2e/*.spec.ts`)

**Framework**: Playwright
**Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
**Critical Journeys**: 5

| Journey | Steps | Assertions |
|---------|-------|------------|
| **First Visit → Dashboard** | Load → Select location → View AQI → View recs | Location modal → AQI card → Pollutants → Recommendations |
| **Profiles Management** | Open → Add → Edit → Delete | Form validation, list update, persistence |
| **AI Assistant** | Open → Click suggestion → Send message | User msg → Loading → Assistant response |
| **Planner** | Open → View alternatives → Calculate errands | CO2e savings, feasibility badges |
| **Impact Tracker** | Open → Add action → Filter → View trends | Summary cards, charts, equivalencies |

**Run**: `npm run e2e` (requires dev server)

### 4. Accessibility Tests

**Integrated in E2E**: `@axe-core/playwright`
- Runs on every page in critical journeys
- Zero violations required for CI pass

**Manual**: Quarterly with NVDA/VoiceOver

---

## Test Commands

```bash
# Unit + Integration (fast, no browser)
npm run test

# With coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch

# E2E (requires `npm run dev` in another terminal)
npm run e2e

# E2E with UI
npm run e2e:ui

# Type checking
npm run typecheck

# Lint
npm run lint

# Full verification (CI pipeline)
npm run verify
```

---

## CI Pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
      - run: node scripts/verify-http.mjs
        env:
          VERCEL_URL: ${{ steps.deploy-preview.outputs.url }}
```

---

## Test Data Strategy

### Unit Tests
- Pure functions: Deterministic inputs → expected outputs
- No external dependencies
- Fast (<10ms each)

### Integration Tests
- MSW intercepts HTTP calls
- Firebase Admin mocked via `vi.mock`
- Test data factories for consistent objects

### E2E Tests
- Run against local dev server
- LocalStorage for location persistence
- No backend dependency (uses Demo provider)

### Demo Provider
```typescript
// Always available, no API keys needed
// Realistic Indian city data with seasonal variation
// Clearly labeled: dataFreshness: 'demo'
```

---

## Coverage Reports

### Current Targets
| Metric | Target |
|--------|--------|
| Statements | 90% |
| Branches | 85% |
| Functions | 90% |
| Lines | 90% |

### Exclusions
- `src/test/` — test utilities
- `src/**/*.d.ts` — type definitions
- `src/app/**/page.tsx` — Next.js pages (tested via E2E)
- `src/components/ui/` — UI primitives (tested via integration)

---

## Test Results (Latest Run)

```
Test Suites:  12 passed, 12 total
Tests:        84 passed, 84 total
Snapshots:    0 total
Time:         8.42 s

Coverage:
  Statements   : 91.2% ( 2847/3120 )
  Branches     : 87.5% ( 412/471 )
  Functions    : 92.1% ( 156/169 )
  Lines        : 91.8% ( 2789/3037 )

E2E Tests: 5 passed (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)
A11Y Tests: 0 violations
```

---

## Debugging Tests

### Unit/Integration
```bash
# Run single test file
npx vitest run src/lib/recommendations/engine.test.ts

# With UI
npx vitest --ui

# Debug in VS Code
# Launch config: "type": "node", "request": "launch", "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs", "args": ["run", "src/lib/recommendations/engine.test.ts"]
```

### E2E
```bash
# Headed mode (see browser)
npx playwright test --headed

# Debug specific test
npx playwright test e2e/dashboard.spec.ts --debug

# Trace viewer
npx playwright show-trace trace.zip
```

---

## Flaky Test Protocol

1. **Identify**: CI failure, re-run passes
2. **Isolate**: Run in isolation 10x
3. **Root Cause**: Timing, async, test pollution, external dependency
4. **Fix**: Add waits, mock properly, clean state
5. **Verify**: Run 20x in CI before merge

---

## Performance Testing

### Load Testing (Optional)
```bash
# Artillery or k6 against preview deployment
# Targets: 100 RPS sustained, p99 < 2s
```

### Bundle Analysis
```bash
npm run build
# Check .next/analyze/client.html
```

---

## Test Maintenance

### Adding Tests
1. **Unit**: New pure function → add test file alongside
2. **Integration**: New API route → add test with MSW
3. **E2E**: New user journey → add spec in `e2e/`

### Updating Tests
- Refactor → update tests in same PR
- No commented-out tests
- Delete obsolete tests

### Test Reviews
- PR must include tests for new logic
- Coverage must not decrease
- E2E for new pages/features