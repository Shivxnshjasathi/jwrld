# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.spec.ts >> Booking Flow UI >> checkout page renders structure
- Location: tests/booking.spec.ts:43:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/book/pool/checkout", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - paragraph [ref=e6]: Loading...
  - button "Open Next.js Dev Tools" [ref=e12] [cursor=pointer]:
    - img [ref=e13]
  - alert [ref=e16]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Booking Flow UI', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Authenticate as Guest first to bypass auth redirects
  6  |     await page.goto('/login');
  7  |     await page.locator('button:has-text("Guest")').click();
  8  |     
  9  |     // Some environments may not have Firebase configured, check both buttons
  10 |     const guestBtn = page.locator('button:has-text("Continue as Guest")');
  11 |     const demoBtn = page.locator('text=Continue in Demo Mode');
  12 |     
  13 |     // We just try clicking guest
  14 |     await guestBtn.click();
  15 |     
  16 |     try {
  17 |       await page.waitForURL('**/home', { timeout: 8000 });
  18 |     } catch (e) {
  19 |       // If we didn't get to home, try the demo button
  20 |       if (await demoBtn.isVisible()) {
  21 |         await demoBtn.click();
  22 |         await page.waitForURL('**/home', { timeout: 5000 });
  23 |       }
  24 |     }
  25 |   });
  26 | 
  27 |   test('home page renders tabs and date picker', async ({ page }) => {
  28 |     await page.goto('/home');
  29 |     
  30 |     await expect(page.locator('text=Jaaduwrld')).toBeVisible();
  31 |     await expect(page.locator('text=8-Ball Pool')).toBeVisible();
  32 |     await expect(page.locator('text=Snooker')).toBeVisible();
  33 |     await expect(page.locator('text=PS5')).toBeVisible();
  34 |     
  35 |     // Date Picker should be visible
  36 |     await expect(page.locator('text=Select Date')).toBeVisible();
  37 |     await expect(page.locator('text=Duration')).toBeVisible();
  38 |     
  39 |     // Check Book Experience button
  40 |     await expect(page.locator('button:has-text("Book Experience")')).toBeVisible();
  41 |   });
  42 | 
  43 |   test('checkout page renders structure', async ({ page }) => {
> 44 |     await page.goto('/book/pool/checkout');
     |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  45 |     
  46 |     await expect(page.locator('text=Checkout')).toBeVisible();
  47 |     await expect(page.locator('text=Invite Friends')).toBeVisible();
  48 |     await expect(page.locator('text=Apply Promo Code')).toBeVisible();
  49 |     await expect(page.locator('button:has-text("Book")')).toBeVisible();
  50 |   });
  51 | });
  52 | 
```