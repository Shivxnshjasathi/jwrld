# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: profile.spec.ts >> Profile and Gamification UI >> profile page renders core elements
- Location: tests/profile.spec.ts:22:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/profile", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Profile and Gamification UI', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Authenticate as Guest first to bypass auth redirects
  6  |     await page.goto('/login');
  7  |     await page.locator('button:has-text("Guest")').click();
  8  |     const guestBtn = page.locator('button:has-text("Continue as Guest")');
  9  |     const demoBtn = page.locator('text=Continue in Demo Mode');
  10 |     
  11 |     await guestBtn.click();
  12 |     try {
  13 |       await page.waitForURL('**/home', { timeout: 8000 });
  14 |     } catch (e) {
  15 |       if (await demoBtn.isVisible()) {
  16 |         await demoBtn.click();
  17 |         await page.waitForURL('**/home', { timeout: 5000 });
  18 |       }
  19 |     }
  20 |   });
  21 | 
  22 |   test('profile page renders core elements', async ({ page }) => {
> 23 |     await page.goto('/profile');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  24 | 
  25 |     // Check header
  26 |     await expect(page.locator('text=Jaaduwrld').first()).toBeVisible();
  27 |     await expect(page.locator('text=Art and Arcade').first()).toBeVisible();
  28 |     
  29 |     // Check main sections
  30 |     await expect(page.locator('h1:has-text("Profile")')).toBeVisible();
  31 |     await expect(page.locator('text=Jaadu Pass')).toBeVisible();
  32 |     
  33 |     // Gamification elements
  34 |     await expect(page.locator('text=Tier')).toBeVisible();
  35 |     await expect(page.locator('text=Jaadu XP')).toBeVisible();
  36 |     
  37 |     // Refer and Earn
  38 |     await expect(page.locator('text=Refer & Earn ₹50')).toBeVisible();
  39 |     await expect(page.locator('text=Generate My Code')).toBeVisible();
  40 |     
  41 |     // Menu items
  42 |     await expect(page.locator('text=My Friends').nth(1)).toBeVisible(); // Heading
  43 |     await expect(page.locator('text=Tournaments & Events')).toBeVisible();
  44 |     await expect(page.locator('text=My Bookings')).toBeVisible();
  45 |     await expect(page.locator('text=Help & Support')).toBeVisible();
  46 |     
  47 |     // Sign out button
  48 |     await expect(page.locator('text=Sign Out')).toBeVisible();
  49 |   });
  50 | });
  51 | 
```