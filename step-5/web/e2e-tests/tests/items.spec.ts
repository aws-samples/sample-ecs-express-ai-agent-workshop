import { test, expect } from "@playwright/test";

test("can sign up, create an item, and delete it", async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = "password123";

  // Sign up
  await page.goto("/signup");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign Up")');

  // Should redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/);

  // Navigate to items
  await page.click('a:has-text("Items")');
  await expect(page).toHaveURL(/\/items/);

  // Create an item
  const itemName = `Test Item ${Date.now()}`;
  await page.fill('input[placeholder="Item name"]', itemName);
  await page.click('button:has-text("Add")');

  // Verify item appears
  await expect(page.locator(`text=${itemName}`)).toBeVisible();

  // Delete the item
  const itemRow = page.locator(`li:has-text("${itemName}")`);
  await itemRow.locator('button:has-text("Delete")').click();

  // Verify item is removed
  await expect(page.locator(`text=${itemName}`)).not.toBeVisible();
});
