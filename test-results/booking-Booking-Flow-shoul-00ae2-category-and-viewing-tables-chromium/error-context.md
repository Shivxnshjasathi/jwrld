# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking.spec.ts >> Booking Flow >> should allow navigating to a booking category and viewing tables
- Location: tests/booking.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Book a Table').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Book a Table').first()

```

```yaml
- main:
  - heading "Jaaduwrld" [level=1]
  - paragraph: Art and Arcade
  - paragraph: Enter the Arcade
  - button "Log In"
  - button "Sign Up"
  - button "Guest"
  - text: Email Address mail
  - textbox "Email Address":
    - /placeholder: pilot@jaaduwrld.com
  - text: Password
  - button "Forgot?"
  - text: lock
  - textbox "Password":
    - /placeholder: ••••••••
  - button "visibility_off"
  - checkbox "check Remember me"
  - text: check Remember me
  - button "Initiate Sequence arrow_forward"
  - text: Or
  - button "Sign in with Google":
    - img
    - text: Sign in with Google
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Booking Flow', () => {
  4  |   test('should allow navigating to a booking category and viewing tables', async ({ page }) => {
  5  |     await page.goto('/home');
  6  |     
  7  |     // Check if the Book section is present
> 8  |     await expect(page.locator('text=Book a Table').first()).toBeVisible();
     |                                                             ^ Error: expect(locator).toBeVisible() failed
  9  |     
  10 |     // Click on the Pool category
  11 |     const poolCard = page.locator('a[href="/book/pool"]').first();
  12 |     if (await poolCard.isVisible()) {
  13 |       await poolCard.click();
  14 |       
  15 |       // We should be on the category page
  16 |       await expect(page).toHaveURL(/\/book\/pool/);
  17 |       
  18 |       // Ensure the checkout or book button exists
  19 |       await expect(page.locator('text=Book Now').first()).toBeVisible({ timeout: 10000 });
  20 |     }
  21 |   });
  22 | });
  23 | 
```