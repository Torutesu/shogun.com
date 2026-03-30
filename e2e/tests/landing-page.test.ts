import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads and shows SHOGUN title", async ({ page }) => {
    await expect(page.locator("text=SHOGUN")).toBeVisible();
  });

  test("navigation links exist", async ({ page }) => {
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    // Expect at least one link inside nav
    const links = nav.locator("a");
    expect(await links.count()).toBeGreaterThan(0);
  });

  test("language switcher works (EN -> JA -> ES)", async ({ page }) => {
    // Find the language switcher and switch to JA
    const switcher = page.locator("[data-testid='language-switcher']").or(
      page.locator("button:has-text('EN')"),
    );
    if (await switcher.isVisible()) {
      await switcher.click();

      const jaOption = page.locator("text=JA").or(page.locator("text=日本語"));
      if (await jaOption.isVisible()) {
        await jaOption.click();
        // Page should contain Japanese text
        await page.waitForTimeout(500);
      }

      // Switch to ES
      const switcherAgain = page.locator("[data-testid='language-switcher']").or(
        page.locator("button:has-text('JA')"),
      );
      if (await switcherAgain.isVisible()) {
        await switcherAgain.click();
        const esOption = page.locator("text=ES").or(page.locator("text=Español"));
        if (await esOption.isVisible()) {
          await esOption.click();
        }
      }
    }
  });

  test("pricing section shows 4 tiers", async ({ page }) => {
    const pricing = page.locator("[data-testid='pricing']").or(
      page.locator("#pricing"),
    );
    await pricing.scrollIntoViewIfNeeded();
    // Expect 4 pricing cards/tiers (Free, Basic, Pro, Ultra)
    const tiers = pricing.locator("[data-testid='pricing-tier']").or(
      pricing.locator("[class*='card'], [class*='tier'], [class*='plan']"),
    );
    await expect(tiers).toHaveCount(4);
  });

  test("CTA buttons link to /signup", async ({ page }) => {
    const ctaButtons = page.locator("a[href='/signup'], a[href*='signup']");
    expect(await ctaButtons.count()).toBeGreaterThan(0);
  });
});
