import { test, expect } from "@playwright/test";

test("homepage loads and shows title", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("ECS Express Workshop");
});

test("homepage displays backend git SHA", async ({ page }) => {
  await page.goto("/");
  const sha = page.locator("[data-testid='backend-sha']");
  await expect(sha).toBeVisible();
  // Should show a SHA or "Backend unreachable" — not "loading..."
  await expect(sha).not.toHaveText(/loading/);
});
