import { test, expect } from "@playwright/test";

test("homepage loads and shows Next.js content", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Create Next App/i);
  await expect(page.locator("img[alt='Next.js logo']")).toBeVisible();
});
