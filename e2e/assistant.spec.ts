import { test, expect } from '@playwright/test';

test.describe('AI Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/dashboard/assistant');
    await page.waitForLoadState('networkidle');
  });

  test('loads assistant page', async ({ page }) => {
    await expect(page.locator('text=SmogShield Assistant')).toBeVisible();
    await expect(page.locator('text=Ask me about air quality')).toBeVisible();
  });

  test('shows suggestion chips', async ({ page }) => {
    await expect(page.locator('text=What\\'s the current AQI?')).toBeVisible();
    await expect(page.locator('text=How to choose an air purifier?')).toBeVisible();
    await expect(page.locator('text=Generate today\\'s action plan')).toBeVisible();
  });

  test('can send a message', async ({ page }) => {
    const input = page.locator('input[placeholder*="Ask me"]');
    await input.fill("What's the current AQI?");
    await page.click('button:has-text("Send")');

    // Should show user message
    await expect(page.locator('text=What\\'s the current AQI?')).toBeVisible();

    // Should show loading state
    await expect(page.locator('text=Thinking...')).toBeVisible({ timeout: 5000 });
  });

  test('clicking suggestion fills input', async ({ page }) => {
    await page.click('text=How to choose an air purifier?');
    const input = page.locator('input[placeholder*="Ask me"]');
    await expect(input).toHaveValue('How to choose an air purifier?');
  });

  test('shows disclaimer on first visit', async ({ page }) => {
    await expect(page.locator('text=AI responses are for informational purposes only')).toBeVisible();
    await page.click('text=Done');
    await expect(page.locator('text=AI responses are for informational purposes only')).not.toBeVisible();
  });
});