import { test, expect } from "@playwright/test";

test("unauthenticated user is redirected to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/signin/);
  await expect(page.locator("h1")).toHaveText("Sign In");
});
