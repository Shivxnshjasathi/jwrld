import { test, expect } from '@playwright/test';

test.describe('Booking Flow UI', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as Guest first to bypass auth redirects
    await page.goto('/login');
    await page.locator('button:has-text("Guest")').click();
    
    // Some environments may not have Firebase configured, check both buttons
    const guestBtn = page.locator('button:has-text("Continue as Guest")');
    const demoBtn = page.locator('text=Continue in Demo Mode');
    
    // We just try clicking guest
    await guestBtn.click();
    
    try {
      await page.waitForURL('**/home', { timeout: 8000 });
    } catch (e) {
      // If we didn't get to home, try the demo button
      if (await demoBtn.isVisible()) {
        await demoBtn.click();
        await page.waitForURL('**/home', { timeout: 5000 });
      }
    }
  });

  test('home page renders tabs and date picker', async ({ page }) => {
    await page.goto('/home');
    
    await expect(page.locator('text=Jaaduwrld')).toBeVisible();
    await expect(page.locator('text=8-Ball Pool')).toBeVisible();
    await expect(page.locator('text=Snooker')).toBeVisible();
    await expect(page.locator('text=PS5')).toBeVisible();
    
    // Date Picker should be visible
    await expect(page.locator('text=Select Date')).toBeVisible();
    await expect(page.locator('text=Duration')).toBeVisible();
    
    // Check Book Experience button
    await expect(page.locator('button:has-text("Book Experience")')).toBeVisible();
  });

  test('checkout page renders structure', async ({ page }) => {
    await page.goto('/book/pool/checkout');
    
    await expect(page.locator('text=Checkout')).toBeVisible();
    await expect(page.locator('text=Invite Friends')).toBeVisible();
    await expect(page.locator('text=Apply Promo Code')).toBeVisible();
    await expect(page.locator('button:has-text("Book")')).toBeVisible();
  });
});
