# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Flow >> should load the admin dashboard and navigate to coupons
- Location: tests/admin.spec.ts:22:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/admin", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - img [ref=e5]
    - heading "Jaaduwrld" [level=1] [ref=e8]
    - paragraph [ref=e9]: Art and Arcade
  - paragraph [ref=e14]: Loading...
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Admin Flow', () => {
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
  22 |   test('should load the admin dashboard and navigate to coupons', async ({ page }) => {
> 23 |     await page.goto('/admin');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  24 |     
  25 |     // Check if the dashboard title exists
  26 |     await expect(page.locator('text=Admin Dashboard').first()).toBeVisible({ timeout: 10000 });
  27 |     
  28 |     // Check if Coupons button/link exists and click it
  29 |     const couponsLink = page.locator('text=Manage Coupons');
  30 |     await expect(couponsLink).toBeVisible();
  31 |     await couponsLink.click();
  32 |     
  33 |     // Should navigate to /admin/coupons
  34 |     await expect(page).toHaveURL(/\/admin\/coupons/);
  35 |   });
  36 | });
  37 | 
```