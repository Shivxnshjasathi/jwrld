import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
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

  test('should load the admin dashboard and navigate to coupons', async ({ page }) => {
    await page.goto('/admin');
    
    // Check if the dashboard title exists
    await expect(page.locator('text=Admin Dashboard').first()).toBeVisible({ timeout: 10000 });
    
    // Check if Coupons button/link exists and click it
    const couponsLink = page.locator('text=Manage Coupons');
    await expect(couponsLink).toBeVisible();
    await couponsLink.click();
    
    // Should navigate to /admin/coupons
    await expect(page).toHaveURL(/\/admin\/coupons/);
  });
});
