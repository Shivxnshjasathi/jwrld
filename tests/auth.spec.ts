import { test, expect } from '@playwright/test';

test.describe('Authentication Flow UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display main login screen elements', async ({ page }) => {
    await expect(page.locator('text=Jaaduwrld').first()).toBeVisible();
    await expect(page.locator('text=Art and Arcade').first()).toBeVisible();
    
    // Check toggle buttons
    await expect(page.locator('button:has-text("Log In")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Up")')).toBeVisible();
    await expect(page.locator('button:has-text("Guest")')).toBeVisible();
    
    // Check if email input exists
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Check buttons
    await expect(page.locator('button:has-text("Initiate Sequence")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible();
  });

  test('should show validation error for empty fields', async ({ page }) => {
    // Click submit without filling email/password
    await page.locator('button:has-text("Initiate Sequence")').click();
    
    // Error should appear
    await expect(page.locator('text=Email and password are required')).toBeVisible();
  });

  test('should switch to signup mode and show phone input', async ({ page }) => {
    await page.locator('button:has-text("Sign Up")').click();
    
    // Phone input should now be visible
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible();
    
    // Button text should change
    await expect(page.locator('button:has-text("Create Access Pass")')).toBeVisible();
  });
});
