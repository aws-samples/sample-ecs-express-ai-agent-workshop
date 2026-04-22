import { test, expect } from "@playwright/test";

test("can create and delete an item", async ({ page }) => {
  await page.goto("/");

  // Wait for items section to load
  await expect(page.locator("[data-testid='items-section']")).toBeVisible();

  // Create an item
  const itemName = `Test Item ${Date.now()}`;
  await page.fill('input[placeholder="Item name"]', itemName);
  await page.click('button:has-text("Add")');

  // Verify item appears in the list
  const itemsList = page.locator("[data-testid='items-list']");
  await expect(itemsList.locator(`text=${itemName}`)).toBeVisible();

  // Delete the item
  const itemRow = itemsList.locator(`li:has-text("${itemName}")`);
  await itemRow.locator('button:has-text("Delete")').click();

  // Verify item is removed
  await expect(itemsList.locator(`text=${itemName}`)).not.toBeVisible();
});
