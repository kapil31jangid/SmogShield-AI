import { test, expect } from '@playwright/test';

test.describe('SmogShield AI - Browser Functional Verification', () => {
  test('1. First Visit & Location Selection Modal & AQI Metrics', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/en/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // If modal is visible, click a city button
    const delhiBtn = page.getByRole('button', { name: /delhi/i }).first();
    await delhiBtn.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    if (await delhiBtn.isVisible()) {
      await delhiBtn.click();
    }

    // Verify main Dashboard heading and AQI indicator card
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20000 });
    // Check for pollutant elements
    await expect(page.getByText('PM2.5').first()).toBeVisible({ timeout: 20000 });
  });

  test('2. Navigation Across All Feature Pages', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Profiles
    await page.goto('/en/dashboard/profiles');
    await expect(page.locator('h1').first()).toHaveText(/profile/i, { timeout: 15000 });

    // 2. Assistant
    await page.goto('/en/dashboard/assistant');
    await expect(page.locator('h1').first()).toHaveText(/assistant/i, { timeout: 15000 });

    // 3. Planner
    await page.goto('/en/dashboard/planner');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

    // 4. Impact
    await page.goto('/en/dashboard/impact');
    await expect(page.locator('h1').first()).toHaveText(/impact/i, { timeout: 15000 });

    // 5. Challenges
    await page.goto('/en/dashboard/challenges');
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

    // 6. Settings
    await page.goto('/en/dashboard/settings');
    await expect(page.locator('h1').first()).toHaveText(/setting/i, { timeout: 15000 });
  });

  test('3. AI Assistant Functional Interaction', async ({ page }) => {
    await page.goto('/en/dashboard/assistant');
    await page.waitForLoadState('domcontentloaded');

    const inputField = page.getByPlaceholder(/ask me about/i);
    await expect(inputField).toBeVisible({ timeout: 15000 });
    await inputField.fill('How do I reduce my family air pollution exposure?');

    const sendBtn = page.getByRole('button', { name: /send/i }).or(page.locator('button[type="submit"]')).first();
    await sendBtn.click();

    // Verify response message container contains generated guidance
    await expect(page.locator('.prose').first()).toBeVisible({ timeout: 15000 });
  });

  test('4. Locale Rendering Verification', async ({ page }) => {
    await page.goto('/hi/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Verify page rendered with content on Hindi route
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15000 });
  });
});
