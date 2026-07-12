import { test, expect } from '@playwright/test';

test.describe('Social and Chats Flow UI', () => {
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

  test('social page renders all tabs', async ({ page }) => {
    await page.goto('/social');
    
    await expect(page.locator('text=Social')).toBeVisible();
    await expect(page.locator('button:has-text("My Friends")')).toBeVisible();
    await expect(page.locator('button:has-text("Find Users")')).toBeVisible();
    await expect(page.locator('button:has-text("Requests")')).toBeVisible();
  });

  test('search tab renders input correctly', async ({ page }) => {
    await page.goto('/social');

    // Click Find Users tab
    await page.locator('button:has-text("Find Users")').click();
    
    const searchInput = page.locator('input[placeholder="Search by name or email..."]');
    await expect(searchInput).toBeVisible();
    await expect(page.locator('button:has-text("Search")')).toBeVisible();
    
    await searchInput.fill('Test User');
    await expect(searchInput).toHaveValue('Test User');
  });

  test('chats page renders correctly', async ({ page }) => {
    await page.goto('/chats');

    await expect(page.locator('text=Chats').first()).toBeVisible();
    await expect(page.locator('text=My Friends')).toBeVisible();
  });
});
