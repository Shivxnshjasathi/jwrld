# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> should display login page and phone number input
- Location: tests/auth.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Welcome to Jaaduwrld').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Welcome to Jaaduwrld').first()

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
  3  | test.describe('Authentication Flow', () => {
  4  |   test('should display login page and phone number input', async ({ page }) => {
  5  |     await page.goto('/login');
  6  |     
  7  |     // Check if the logo or title is present
> 8  |     await expect(page.locator('text=Welcome to Jaaduwrld').first()).toBeVisible();
     |                                                                     ^ Error: expect(locator).toBeVisible() failed
  9  |     
  10 |     // Check if phone number input exists
  11 |     const phoneInput = page.locator('input[type="tel"]');
  12 |     await expect(phoneInput).toBeVisible();
  13 |     
  14 |     // Check if the continue button exists
  15 |     const continueBtn = page.locator('button:has-text("Continue")');
  16 |     await expect(continueBtn).toBeVisible();
  17 |   });
  18 | });
  19 | 
```