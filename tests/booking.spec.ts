import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('should allow navigating to a booking category and viewing tables', async ({ page }) => {
    await page.goto('/home');
    
    // Check if the Book section is present
    await expect(page.locator('text=Book a Table').first()).toBeVisible();
    
    // Click on the Pool category
    const poolCard = page.locator('a[href="/book/pool"]').first();
    if (await poolCard.isVisible()) {
      await poolCard.click();
      
      // We should be on the category page
      await expect(page).toHaveURL(/\/book\/pool/);
      
      // Ensure the checkout or book button exists
      await expect(page.locator('text=Book Now').first()).toBeVisible({ timeout: 10000 });
    }
  });
});
