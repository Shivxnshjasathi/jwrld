import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page and phone number input', async ({ page }) => {
    await page.goto('/login');
    
    // Check if the logo or title is present
    await expect(page.locator('text=Welcome to Jaaduwrld').first()).toBeVisible();
    
    // Check if phone number input exists
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible();
    
    // Check if the continue button exists
    const continueBtn = page.locator('button:has-text("Continue")');
    await expect(continueBtn).toBeVisible();
  });
});
