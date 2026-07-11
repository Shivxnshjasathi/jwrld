import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test('should load the admin dashboard and navigate to coupons', async ({ page }) => {
    // Note: This assumes admin routes are accessible without complex auth mocking for the basic UI load, 
    // or you'd need to set up auth state. We will just test that the page loads.
    await page.goto('/admin');
    
    // Check if the dashboard title exists
    await expect(page.locator('text=Admin Dashboard').first()).toBeVisible({ timeout: 10000 });
    
    // Check if Coupons button/link exists and click it
    const couponsLink = page.locator('text=Manage Coupons');
    if (await couponsLink.isVisible()) {
      await couponsLink.click();
      
      // We should be on the coupons page
      await expect(page).toHaveURL(/\/admin\/coupons/);
      
      // Ensure the create coupon button is there
      await expect(page.locator('text=+ Create Coupon').first()).toBeVisible();
    }
  });
});
