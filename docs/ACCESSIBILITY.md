# Accessibility Conformance — SmogShield AI

## Target Standard

**WCAG 2.1 Level AA** — Perceivable, Operable, Understandable, Robust

---

## Current Conformance Status

| Principle | Criteria | Status | Notes |
|-----------|----------|--------|-------|
| **Perceivable** | 1.1 Non-text Content | ✅ | Alt text, ARIA labels, icons with text |
| | 1.2 Time-based Media | N/A | No audio/video content |
| | 1.3 Adaptable | ✅ | Semantic HTML, responsive, no loss of function |
| | 1.4 Distinguishable | ✅ | 4.5:1 contrast, text resize, no images of text |
| **Operable** | 2.1 Keyboard Accessible | ✅ | All interactive elements keyboard-reachable |
| | 2.2 Enough Time | ✅ | No time limits; auto-refresh user-controllable |
| | 2.3 Seizures | ✅ | No flashing content > 3Hz |
| | 2.4 Navigable | ✅ | Skip link, headings, focus order, breadcrumbs |
| **Understandable** | 3.1 Readable | ✅ | Lang attr, simple language, glossary tooltips |
| | 3.2 Predictable | ✅ | Consistent nav, no context change on focus |
| | 3.3 Input Assistance | ✅ | Labels, errors, suggestions, confirmation |
| **Robust** | 4.1 Compatible | ✅ | Valid HTML, ARIA roles, status messages |

---

## Implementation Details

### Semantic HTML Structure
```tsx
// Page structure
<header>          // Site header with nav
<main id="main-content" tabIndex={-1}>  // Skip target
  <h1>Page Title</h1>
  <section aria-labelledby="aqi-heading">  // AQI card
  <section aria-labelledby="rec-heading">  // Recommendations
<footer>          // Attribution, legal
```

### Color & Contrast
| Element | Foreground | Background | Ratio | WCAG |
|---------|-----------|------------|-------|------|
| Primary text | `#1a232c` | `#ffffff` | 14.9:1 | AAA |
| Secondary text | `#475569` | `#ffffff` | 7.8:1 | AAA |
| Primary button | `#ffffff` | `#2563eb` | 5.2:1 | AA |
| AQI Good badge | `#166534` | `#dcfce7` | 6.8:1 | AA |
| AQI Hazardous badge | `#7f1d1d` | `#fef2f2` | 9.1:1 | AAA |
| Focus ring | `#2563eb` | — | — | Visible |

**Dark mode**: All ratios maintained (tested with `prefers-color-scheme`).

### Keyboard Navigation
| Component | Keys | Focus Visible |
|-----------|------|---------------|
| Skip link | `Tab` (first) | Yes |
| Navigation | `Tab` / `Shift+Tab` | Yes |
| Buttons | `Enter` / `Space` | Yes |
| Links | `Enter` | Yes |
| Modal | `Tab` (trapped), `Esc` (close) | Yes |
| Tabs | `ArrowLeft/Right`, `Home/End` | Yes |
| Select | `Space` (open), `ArrowUp/Down`, `Enter` | Yes |
| Input | Standard | Yes |

### Focus Management
```tsx
// Modal focus trap
useEffect(() => {
  const focusable = modalRef.current.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  first?.focus();

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', handleTab);
  return () => document.removeEventListener('keydown', handleTab);
}, []);

// Skip link
<a href="#main-content" className="sr-only focus:not-sr-only fixed top-4 left-4 z-50 px-4 py-2 bg-brand-primary text-white rounded">
  Skip to main content
</a>
```

### Screen Reader Support
| Feature | Implementation |
|---------|----------------|
| Live regions | `aria-live="polite"` for AQI updates |
| Status messages | `role="status"` for loading/error |
| Labels | `<label htmlFor>` + `aria-label` where needed |
| Descriptions | `aria-describedby` for help text |
| Headings | Single `<h1>`, logical `<h2>`-`<h4>` hierarchy |
| Landmarks | `<nav>`, `<main>`, `<aside>`, `<footer>` |
| Tables | Not used (cards/grid instead) |
| Charts | Text alternatives + data tables |

### Language Support
```tsx
<html lang={locale}>  // 'en' or 'hi'
```
- All user-facing text via `next-intl`
- Hindi translations reviewed by native speakers
- RTL not required (Hindi uses LTR)

### Responsive & Zoom
- **320px minimum** width (mobile-first)
- **400% zoom** tested (no horizontal scroll)
- Touch targets **≥44×44px**
- No hover-only interactions

### Motion & Animation
```css
/* Respects prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
- No auto-playing animation > 5s
- `animate-in` classes respect reduced motion

---

## Testing Protocol

### Automated (CI)
```bash
# axe-core in Playwright
npm run test:e2e  # Includes a11y checks
```

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('dashboard has no a11y violations', async ({ page }) => {
  await page.goto('/en/dashboard');
  await page.click('text=Delhi, India');
  await page.click('text=Get Started');
  await page.waitForSelector('text=Current AQI');

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### Manual Testing Checklist
- [ ] **Keyboard only**: Complete all user journeys
- [ ] **Screen reader**: NVDA (Windows) + VoiceOver (Mac)
- [ ] **Zoom**: 200%, 400% in Chrome/Firefox
- [ ] **High contrast**: Windows HC mode, macOS "Increase contrast"
- [ ] **Reduced motion**: OS setting + browser devtools
- [ ] **Dark/light**: Both themes pass contrast
- [ ] **Hindi**: All text translated, no English leakage
- [ ] **Touch**: Mobile gestures work, no hover traps

### Tools Used
- axe-core / @axe-core/playwright
- Lighthouse (CI)
- WAVE browser extension
- Colour Contrast Analyser (TPGi)
- NVDA / VoiceOver

---

## Known Limitations

| Issue | Impact | Mitigation |
|-------|--------|------------|
| Chart color-only encoding | Colorblind users | Text labels + patterns + data table |
| Hindi fonts | May not render on all systems | System font stack includes Noto Sans Devanagari |
| Complex modals | Focus trap edge cases | Tested with axe, manual verification |
| Live region updates | Screen reader announcement timing | `aria-live="polite"` + `aria-atomic="true"` |

---

## Continuous Improvement

### Quarterly Audit
1. Run full axe scan on all pages
2. Manual keyboard journey test
3. Screen reader spot-check (5 min each)
4. Update this doc with findings

### User Feedback
- Accessibility feedback link in footer
- Prioritize reported barriers
- Publish remediation timeline

### Training
- All engineers: a11y basics (1hr/quarter)
- Designers: inclusive design patterns
- PMs: a11y as acceptance criteria

---

## Resources

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)
- [WebAIM Checklist](https://webaim.org/standards/wcag/checklist)