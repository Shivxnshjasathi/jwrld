# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: social.spec.ts >> Social and Chats Flow UI >> chats page renders correctly
- Location: tests/social.spec.ts:45:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/chats", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Social and Chats Flow UI', () => {
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
  22 |   test('social page renders all tabs', async ({ page }) => {
  23 |     await page.goto('/social');
  24 |     
  25 |     await expect(page.locator('text=Social')).toBeVisible();
  26 |     await expect(page.locator('button:has-text("My Friends")')).toBeVisible();
  27 |     await expect(page.locator('button:has-text("Find Users")')).toBeVisible();
  28 |     await expect(page.locator('button:has-text("Requests")')).toBeVisible();
  29 |   });
  30 | 
  31 |   test('search tab renders input correctly', async ({ page }) => {
  32 |     await page.goto('/social');
  33 | 
  34 |     // Click Find Users tab
  35 |     await page.locator('button:has-text("Find Users")').click();
  36 |     
  37 |     const searchInput = page.locator('input[placeholder="Search by name or email..."]');
  38 |     await expect(searchInput).toBeVisible();
  39 |     await expect(page.locator('button:has-text("Search")')).toBeVisible();
  40 |     
  41 |     await searchInput.fill('Test User');
  42 |     await expect(searchInput).toHaveValue('Test User');
  43 |   });
  44 | 
  45 |   test('chats page renders correctly', async ({ page }) => {
> 46 |     await page.goto('/chats');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  47 | 
  48 |     await expect(page.locator('text=Chats').first()).toBeVisible();
  49 |     await expect(page.locator('text=My Friends')).toBeVisible();
  50 |   });
  51 | });
  52 | 
```