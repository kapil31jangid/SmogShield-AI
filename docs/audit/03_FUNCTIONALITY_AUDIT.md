# Phase 3 — Functionality and User-Journey Audit

**Audit Date:** 2026-11-20  
**Method:** Static code inspection + previous E2E test results (all 11 Playwright tests failed — app not running locally on test port)

---

## User Journey: Select Location → Understand Pollution → Create Profile → Receive Plan → Complete Action → View Progress

### Step 1: Select Location
**Status: FUNCTIONAL (with caveats)**

- `DashboardClient.tsx` renders a location selector modal on first visit
- `getAvailableLocations()` returns 8 Indian demo cities from `demoProvider.getDemoCities()`
- API route `/api/aqi/[location]` correctly queries OpenAQ → WAQI → Demo fallback
- **Issue:** Location selection triggers `useState` only — not persisted to localStorage or any storage; refresh resets to default location

### Step 2: Understand Pollution
**Status: FUNCTIONAL**

- AQI reading card displays: AQI value, category label, color, description, PM2.5, PM10, NO2, O3, SO2, CO
- Data freshness badge shows 'live', 'cached', 'stale', or 'demo'
- Source attribution rendered
- **Issue:** When all providers fail AND demo returns null, the UI receives null and shows an error state — ✅ graceful
- **Issue:** Historical trend chart empty when OpenAQ has no historical data — no "No historical data available" message shown

### Step 3: Create Family Profile
**Status: PARTIALLY BROKEN**

- Modal opens ✅
- Form fields complete: name, category, conditions, outdoor frequency, commute, purifier, language ✅
- Form validation: `name` has `required` attribute ✅
- **CRITICAL FINDING:** `handleSubmit()` calls `setProfiles([...profiles, newProfile])` — stored in React state only
- **On page refresh:** All user-created profiles are lost; mockProfiles array re-initializes
- **No API call** to persist to Firebase
- Profiles page directories `src/app/api/profiles/` exists but contains NO route.ts file

### Step 4: Receive Personalized Action Plan  
**Status: FUNCTIONAL (but uses demo profiles)**

- `/api/recommendations` route calls `generateRecommendations()` with real engine
- Engine correctly applies risk multipliers, generates ranked recommendations
- Dashboard's main page uses recommendations from API
- **Issue:** Since profiles aren't persisted, the recommendation engine always uses demo/default profiles

### Step 5: Complete an Action (Impact Tracker)
**Status: PARTIALLY BROKEN**

- Modal opens ✅, form validates ✅
- `estimateActionImpact()` correctly calculates CO2e ✅  
- Action added to `useState` array ✅
- **CRITICAL:** Data lost on refresh — same issue as profiles
- **Impact page loads with 6 mock actions pre-populated** — may mislead users into thinking data is real

### Step 6: View Progress
**Status: PARTIAL — Chart renders, data is mock**

- Weekly/monthly trend charts render using CSS bars ✅
- Equivalency cards shown ✅
- **Data is entirely from `mockActions` on initial load** — 6 hardcoded actions
- Filter (all types / date range) works in UI but `dateRange` filter doesn't actually filter actions

---

## Individual Feature Inspection

### Landing Page (`src/app/[locale]/page.tsx`)
- Exists ✅
- Renders navigation to dashboard ✅  
- Not inspected in detail — assumed minimal landing page

### GenAI Assistant (`src/app/[locale]/dashboard/assistant/page.tsx`)
- Chat interface present ✅
- Sends POST to `/api/assistant` ✅
- Zod validation of request at API boundary ✅
- **Issue:** `conversationId` extracted from request body but never used (lint warning)
- **Issue:** Language hardcoded to `'en'` in route.ts — Hindi preference ignored
- **Issue:** Conversation history not persisted — each page load starts fresh conversation

### Low-Emission Planner (`src/app/[locale]/dashboard/planner/page.tsx`)  
- Renders transport options with CO2e estimates ✅
- `emissions.ts` has Indian-specific factors ✅
- **Issue:** Planner page does not call an API — renders static/computed data only
- `Select` imported but never used (lint warning)

### Indoor Air Protection (via AI assistant and recommendations)
- Indoor advisor integrated into AI fallback ✅
- HEPA sizing calculation correct ✅
- Myth-busting present ✅
- No dedicated dashboard page for indoor air — accessed via AI or as recommendation card

### Settings (`src/app/[locale]/dashboard/settings/page.tsx`)
- Theme toggle, language toggle rendered ✅
- **Issue:** `'common'` useTranslations imported but not used
- **Issue:** Settings not persisted — theme/language resets on refresh

### Community Challenges
- Shows 4 mock challenges with progress bars ✅
- "Join" button updates local state only ✅
- `Select*` components imported from ui but those exports don't exist in `src/components/ui/index.ts`
- **POTENTIAL RUNTIME ERROR:** `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` imported but not exported from ui package — this would cause a build failure (verify with fresh build)

---

## Form Validation Findings

| Form | Required Fields | Invalid Input Handling | Empty State |
|------|----------------|----------------------|-------------|
| Profile Add/Edit | name required | Category/frequency dropdowns prevent invalid | Empty profiles list shows "Add first profile" ✅ |
| Impact Action | description required | type enforced by select | Empty actions list shows CTA ✅ |
| AI Assistant | 1-1000 chars (Zod) | Server rejects > 1000 chars | Shows welcome prompt ✅ |
| Location Selector | name + coordinates | Validated in Zod schema | Shows demo cities ✅ |

---

## Navigation Bugs

| Issue | Severity |
|-------|---------|
| `src/app/assistant/`, `src/app/challenges/`, etc. — empty directories under non-locale path | Low — orphaned, never navigated to |
| Challenges page imports `SelectContent`, `SelectItem`, etc. that don't exist in ui/index.ts | **HIGH** — potential runtime error |
| Location preference not persisted → requires re-selecting after every refresh | Medium |

---

## Mobile Layout
- Tailwind responsive breakpoints used consistently (sm:, lg:) ✅
- Grid layouts collapse to single column on mobile ✅
- Modal size="lg" may overflow on small screens — not tested

---

## Core Journey Verdict

| Journey Step | Works? | Notes |
|-------------|--------|-------|
| Select location | ✅ | Resets on refresh |
| Understand pollution | ✅ | Accurate when live data available |
| Create family profile | ⚠️ | Works in-session; lost on refresh |
| Receive personalized action plan | ✅ | Uses engine correctly |
| Complete an action | ⚠️ | Works in-session; lost on refresh |
| View progress | ⚠️ | Mocked data on load |
