import { test, expect } from '@playwright/test';

test.describe('Profile and Gamification UI', () => {
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

  test('profile page renders core elements', async ({ page }) => {
    await page.goto('/profile');

    // Check header
    await expect(page.locator('text=Jaaduwrld').first()).toBeVisible();
    await expect(page.locator('text=Art and Arcade').first()).toBeVisible();
    
    // Check main sections
    await expect(page.locator('h1:has-text("Profile")')).toBeVisible();
    await expect(page.locator('text=Jaadu Pass')).toBeVisible();
    
    // Gamification elements
    await expect(page.locator('text=Tier')).toBeVisible();
    await expect(page.locator('text=Jaadu XP')).toBeVisible();
    
    // Refer and Earn
    await expect(page.locator('text=Refer & Earn ₹50')).toBeVisible();
    await expect(page.locator('text=Generate My Code')).toBeVisible();
    
    // Menu items
    await expect(page.locator('text=My Friends').nth(1)).toBeVisible(); // Heading
    await expect(page.locator('text=Tournaments & Events')).toBeVisible();
    await expect(page.locator('text=My Bookings')).toBeVisible();
    await expect(page.locator('text=Help & Support')).toBeVisible();
    
    // Sign out button
    await expect(page.locator('text=Sign Out')).toBeVisible();
  });
});
