# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: food.spec.ts >> Food Ordering Flow >> should load the food menu and display items
- Location: tests/food.spec.ts:22:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/food", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Food Ordering Flow', () => {
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
  22 |   test('should load the food menu and display items', async ({ page }) => {
> 23 |     await page.goto('/food');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  24 |     
  25 |     // Check if the food section is present
  26 |     await expect(page.locator('text=Café & Kitchen').first()).toBeVisible({ timeout: 10000 });
  27 |     
  28 |     // Ensure that food items are visible
  29 |     // We assume there's at least one "Add" button or similar interaction
  30 |     await expect(page.locator('button:has-text("Add")').first()).toBeVisible();
  31 |   });
  32 | });
  33 | 
```