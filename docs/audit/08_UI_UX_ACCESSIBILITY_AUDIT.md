# Phase 8 — UI/UX and Accessibility Audit

**Audit Date:** 2026-11-20  
**Standard:** WCAG 2.2 AA

---

## Visual Consistency

| Aspect | Assessment |
|--------|------------|
| Color palette | Consistent use of `brand-primary`, `brand-secondary`, `brand-accent` Tailwind tokens throughout |
| Typography | Inter font (via Next.js Font); consistent heading hierarchy with `page-title`, `page-subtitle` utility classes |
| Spacing | 4-unit Tailwind grid used consistently |
| Component reuse | Button, Card, Badge, Modal, Input, Label, Select, Switch, Tabs, Textarea all reused across pages |
| Dark mode | `dark:` Tailwind classes present on most components ✅ |
| Icon consistency | Lucide React icons used uniformly ✅ |

---

## Navigation Clarity

- Main navigation in `Header.tsx` with links to all dashboard sub-pages
- Active route highlighted (inspect required for confirmation)
- Mobile: Header likely collapses — hamburger menu pattern not confirmed from code (no `useState` for mobile menu found in Header)
- **Potential gap:** No visible skip-to-content link for keyboard/screen reader users

---

## Information Density

- Dashboard main page: AQI card, pollutant grid, recommendations, historical chart — high density but organized
- Impact page: 4 summary cards + 2 trend charts + equivalencies + actions list — may be overwhelming on mobile
- Profiles page: Card grid with badges — clear and scannable

---

## Loading and Empty States

| State | Implemented |
|-------|------------|
| Loading spinner during AQI fetch | Likely via SWR (inspect DashboardClient — not seen in code) |
| Empty profiles list | ✅ "No profiles yet, add first profile" |
| Empty actions list | ✅ "No actions logged yet" with CTA |
| AQI API error | ✅ 503 response propagated to UI |
| Demo data badge | ✅ Clearly labeled |

---

## Forms

| Form | Label-Input Pairing | Error Messages | Required Indicator |
|------|-------------------|---------------|-------------------|
| Profile Add/Edit | ✅ `htmlFor` matches `id` | Required attr only | `required` prop on Label |
| Impact Action Add | ✅ | Same | ✅ |
| AI Chat | No label (send button only) | Implicit | N/A |
| Location Selector | Unclear from code | N/A | N/A |

---

## Semantic HTML

- `<h1>` with `page-title` class on each page ✅
- `<main>` wrapper in `MainLayout` (assumed from layout component) — confirm
- `<nav>` in Header ✅ (Lucide navigation items)
- `<form>` with proper `onSubmit` ✅
- `<button>` elements use `<Button>` component which renders `<button>` ✅

---

## Keyboard Navigation

| Feature | Status |
|---------|--------|
| Modal close (Escape key) | Inspect `Modal.tsx` — `onKeyDown` handler needed |
| Form submit on Enter | ✅ `type="submit"` buttons inside forms |
| Tab order | Dependent on DOM order; Tailwind absolute positioning could disrupt |
| Dropdown menus | Select uses native `<select>` — keyboard navigable ✅ |
| Delete confirmation | `confirm()` dialog — accessible but non-standard UX |

---

## Visible Focus Indicators

- Tailwind's `focus:ring-brand-primary` class used in Input, Button components ✅
- Must verify `focus-visible` not overridden by global CSS reset

---

## Screen Reader Labels

| Element | Aria Label |
|---------|-----------|
| Edit profile button | `aria-label={t('editProfile')}` ✅ |
| Delete profile button | `aria-label={t('deleteProfile')}` ✅ |
| Delete action button | `aria-label="Delete"` ✅ |
| AQI chart bars | No `aria-label` on CSS bar charts ⚠️ |
| Impact trend charts | No accessible description ⚠️ |

---

## Color Contrast

| Element | Expected Contrast | Assessment |
|---------|-----------------|------------|
| Primary text on white | `slate-900` on white — ~21:1 | ✅ |
| Secondary text | `slate-600` on white — ~7:1 | ✅ |
| Badge text | varies — `brand-primary` text on light bg | Needs measurement |
| AQI status colors | Bright green (#00e400) on white/light — may fail 3:1 ratio | ⚠️ |
| AQI "Good" color | `#00e400` on white — WCAG contrast ratio ~1.4:1 | ❌ FAILS WCAG AA |

**Critical finding:** The AQI "Good" color `#00e400` (pure bright green) on white background has approximately 1.4:1 contrast ratio — far below the WCAG AA minimum of 4.5:1 for normal text.

---

## Charts Accessibility

The impact page and dashboard use CSS bar charts (div elements with inline `style={{ height: '..%' }}`).

**Issues:**
- No `role="img"` or `aria-label` on chart container
- No table fallback for screen readers
- Chart data not accessible to assistive technologies

---

## Mobile Responsiveness

| Breakpoint | Evidence |
|-----------|---------|
| Grid: 1 col → 2 col → 4 col | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` ✅ |
| Header: flex wrapping | `flex-col sm:flex-row` ✅ |
| Cards: full width on mobile | ✅ |
| Modal: `size="lg"` | May overflow on 320px screens ⚠️ |
| Touch targets | Buttons appear >= 40px via `h-10 w-10` ✅ |

---

## Hindi Text Rendering

- Hindi strings present in translation files and AI fallback ✅
- Google Fonts (Inter) has Devanagari support — confirm font coverage ⚠️
- RTL not needed for Hindi (LTR script) ✅

---

## Reduced Motion

No `prefers-reduced-motion` media query found. CSS transitions used on chart bars:
```css
className="... transition-all duration-300"
```
Should be suppressed for users with motion sensitivity.

---

## Accessibility Score Summary

| Category | Score | Key Issues |
|----------|-------|------------|
| Semantic HTML | 8/10 | Generally correct; skip link missing |
| Color contrast | 5/10 | AQI green color fails; need audit of all badge colors |
| Keyboard navigation | 7/10 | Native controls; modal close needs verification |
| Screen reader support | 6/10 | Charts not accessible; most interactive elements labeled |
| Mobile responsiveness | 8/10 | Good breakpoints; modal overflow risk |
| Forms | 8/10 | Properly labeled; required indicators present |

**WCAG 2.2 AA Status:** PARTIAL — Color contrast issues and chart inaccessibility are concrete failures.
