import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/login/);
    // Should show a login form or heading
    const heading = page.locator("h1, h2, [data-testid='login-heading']");
    await expect(heading.first()).toBeVisible();
  });

  test("signup page loads", async ({ page }) => {
    await page.goto("/signup");
    await expect(page).toHaveURL(/signup/);
    const heading = page.locator("h1, h2, [data-testid='signup-heading']");
    await expect(heading.first()).toBeVisible();
  });

  test("form validation — empty email shows error", async ({ page }) => {
    await page.goto("/login");
    // Find submit button and click without filling in email
    const submitBtn = page.locator(
      "button[type='submit'], button:has-text('Log in'), button:has-text('Sign in')",
    );
    await submitBtn.first().click();
    // Expect an error message
    const error = page.locator(
      "[role='alert'], .error, [data-testid='email-error'], [class*='error']",
    );
    await expect(error.first()).toBeVisible();
  });

  test("navigation between login and signup", async ({ page }) => {
    await page.goto("/login");
    // Find link to signup
    const signupLink = page.locator("a[href='/signup'], a:has-text('Sign up'), a:has-text('Create account')");
    await signupLink.first().click();
    await expect(page).toHaveURL(/signup/);

    // Find link back to login
    const loginLink = page.locator("a[href='/login'], a:has-text('Log in'), a:has-text('Sign in')");
    await loginLink.first().click();
    await expect(page).toHaveURL(/login/);
  });
});
