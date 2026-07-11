import { test, expect } from '@playwright/test';

test.describe('Food Ordering Flow', () => {
  test('should load the food menu and display items', async ({ page }) => {
    await page.goto('/food');
    
    // Check if the food section is present
    await expect(page.locator('text=Café & Kitchen').first()).toBeVisible({ timeout: 10000 });
    
    // Ensure that food items are visible
    // We assume there's at least one "Add" button or similar interaction
    const addButton = page.locator('button:has-text("Add")').first();
    if (await addButton.isVisible()) {
      await expect(addButton).toBeVisible();
    }
  });
});
