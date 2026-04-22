import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Git SHA overlay
// ---------------------------------------------------------------------------
test.describe('Git SHA overlay', () => {
  test('is visible on the sign-in page', async ({ page }) => {
    await page.goto('/signin')
    const sha = page.locator('.git-sha')
    await expect(sha).toBeVisible()
    await expect(sha).not.toBeEmpty()
  })

  test('shows combined f/b format after backend fetch', async ({ page }) => {
    await page.goto('/signin')
    const sha = page.locator('.git-sha')
    // Wait for the label to update from the initial frontend-only value
    await expect(sha).toHaveText(/f\/b: [0-9a-f]+|f: [0-9a-f]+, b: [0-9a-f]+/, {
      timeout: 10_000,
    })
  })
})
