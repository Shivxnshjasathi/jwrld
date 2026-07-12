import { test, expect } from '@playwright/test';

test.describe('Food Ordering Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as Guest first to bypass auth redirects
    await page.goto('/login');
    await page.locator('button:has-text("Guest")').click();
    const guestBtn = page.locator('button:has-text("Continue as Guest")');
    const demoBtn = page.locator('text=Continue in Demo Mode');
    
    await guestBtn.click();
    try {
      await page.waitForURL('**/home', { timeout: 8000 });
    } catch (e) {
      if (await demoBtn.isVisible()) {
        await demoBtn.click();
        await page.waitForURL('**/home', { timeout: 5000 });
      }
    }
  });

  test('should load the food menu and display items', async ({ page }) => {
    await page.goto('/food');
    
    // Check if the food section is present
    await expect(page.locator('text=Café & Kitchen').first()).toBeVisible({ timeout: 10000 });
    
    // Ensure that food items are visible
    // We assume there's at least one "Add" button or similar interaction
    await expect(page.locator('button:has-text("Add")').first()).toBeVisible();
  });
});
