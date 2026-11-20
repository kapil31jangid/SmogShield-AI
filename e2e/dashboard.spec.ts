import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/dashboard');
    // Wait for location modal or dashboard to load
    await page.waitForLoadState('networkidle');
  });

  test('shows location selection modal on first visit', async ({ page }) => {
    // Should show location modal
    await expect(page.locator('text=Choose Your Location')).toBeVisible();
    await expect(page.locator('text=Delhi, India')).toBeVisible();
    await expect(page.locator('text=Mumbai, India')).toBeVisible();
  });

  test('allows selecting a location', async ({ page }) => {
    await page.click('text=Delhi, India');
    await page.click('text=Get Started');
    await expect(page.locator('text=Choose Your Location')).not.toBeVisible();
    await expect(page.locator('text=Air Quality Dashboard')).toBeVisible();
  });

  test('displays AQI card after location selection', async ({ page }) => {
    await page.click('text=Delhi, India');
    await page.click('text=Get Started');

    // Wait for AQI data to load
    await expect(page.locator('text=Current AQI')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=AQI')).toBeVisible();
  });

  test('shows pollutant details', async ({ page }) => {
    await page.click('text=Delhi, India');
    await page.click('text=Get Started');

    await expect(page.locator('text=PM2.5')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=PM10')).toBeVisible();
  });

  test('navigates to other tabs', async ({ page }) => {
    await page.click('text=Delhi, India');
    await page.click('text=Get Started');

    await expect(page.locator('text=Pollutants')).toBeVisible();
    await page.click('text=Pollutants');
    await expect(page.locator('text=NO₂')).toBeVisible();
  });

  test('shows recommendations', async ({ page }) => {
    await page.click('text=Delhi, India');
    await page.click('text=Get Started');

    await expect(page.locator('text=Today\\'s Recommendations')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Indoor Protection')).toBeVisible();
  });

  test('shows family exposure summary', async ({ page }) => {
    await page.click('text=Delhi, India');
    await page.click('text=Get Started');

    await expect(page.locator('text=Family Exposure Summary')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Priya')).toBeVisible();
    await expect(page.locator('text=Arjun')).toBeVisible();
  });

  test('has working refresh button', async ({ page }) => {
    await page.click('text=Delhi, India');
    await page.click('text=Get Started');

    await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
  });

  test('change location works', async ({ page }) => {
    await page.click('text=Delhi, India');
    await page.click('text=Get Started');

    await page.click('button:has-text("Delhi, India")');
    await expect(page.locator('text=Choose Your Location')).toBeVisible();
    await page.click('text=Mumbai, India');
    await page.click('text=Get Started');
    await expect(page.locator('text=Mumbai, India')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('has proper heading hierarchy', async ({ page }) => {
    await page.goto('/en/dashboard');
    await page.click('text=Delhi, India');
    await page.click('text=Get Started');

    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/en/dashboard');
    await page.click('text=Delhi, India');
    await page.click('text=Get Started');

    const refreshBtn = page.locator('button:has-text("Refresh")');
    await expect(refreshBtn).toBeVisible();
    await expect(refreshBtn).toHaveAttribute('aria-label', /refresh/i);
  });
});