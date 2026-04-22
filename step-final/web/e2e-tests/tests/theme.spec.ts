import { test, expect } from '@playwright/test'

let counter = 0
function uniqueEmail(prefix = 'user') {
  counter++
  return `${prefix}.${Date.now()}.${counter}@example.com`
}

const DEFAULT_PASSWORD = 'password123'
const MAILPIT_API_URL = process.env.MAILPIT_API_URL ?? 'http://mailpit:8025'
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://backend:4000'

async function getVerificationToken(email: string): Promise<string> {
  let token: string | undefined
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${MAILPIT_API_URL}/api/v1/search?query=to:${email}`)
    const data = await res.json()
    if (data.messages && data.messages.length > 0) {
      const msgId = data.messages[0].ID
      const msgRes = await fetch(`${MAILPIT_API_URL}/api/v1/message/${msgId}`)
      const msg = await msgRes.json()
      const match = (msg.HTML || msg.Text || '').match(/[?&]token=([a-f0-9-]+)/)
      if (match) {
        token = match[1]
        break
      }
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  if (!token) throw new Error(`Verification email not found for ${email}`)
  return token
}

async function createVerifiedUser(email: string, password = DEFAULT_PASSWORD) {
  await fetch(`${BACKEND_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const token = await getVerificationToken(email)
  await fetch(`${BACKEND_URL}/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
}

// ---------------------------------------------------------------------------
// Theme settings
// ---------------------------------------------------------------------------
test.describe('Theme settings', () => {
  const sharedEmail = uniqueEmail('theme')

  test.beforeAll(async () => {
    await createVerifiedUser(sharedEmail)
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/signin')
    await page.locator('#email').fill(sharedEmail)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/dashboard/)

    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/)
    await page.waitForLoadState('networkidle')
  })

  test('shows theme selector with System, Light, and Dark options', async ({ page }) => {
    const themeSelector = page.locator('.theme-selector')
    await expect(themeSelector).toBeVisible()

    const buttons = themeSelector.locator('.theme-btn')
    await expect(buttons).toHaveCount(3)
  })

  test('System is the default active theme', async ({ page }) => {
    const systemBtn = page.locator('.theme-btn-active')
    await expect(systemBtn).toHaveCount(1)

    // data-theme attribute should not be set for system mode
    const dataTheme = await page.locator('html').getAttribute('data-theme')
    expect(dataTheme).toBeNull()
  })

  test('can switch to Dark theme', async ({ page }) => {
    const darkBtn = page.locator('.theme-btn', { hasText: 'Dark' })
    await darkBtn.click()

    await expect(darkBtn).toHaveClass(/theme-btn-active/)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('can switch to Light theme', async ({ page }) => {
    const lightBtn = page.locator('.theme-btn', { hasText: 'Light' })
    await lightBtn.click()

    await expect(lightBtn).toHaveClass(/theme-btn-active/)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('can switch back to System theme', async ({ page }) => {
    // First switch to dark
    await page.locator('.theme-btn', { hasText: 'Dark' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    // Then switch back to system
    const systemBtn = page.locator('.theme-btn', { hasText: 'System' })
    await systemBtn.click()

    await expect(systemBtn).toHaveClass(/theme-btn-active/)
    const dataTheme = await page.locator('html').getAttribute('data-theme')
    expect(dataTheme).toBeNull()
  })

  test('theme persists after page reload', async ({ page }) => {
    // Switch to dark
    await page.locator('.theme-btn', { hasText: 'Dark' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    // Wait for the preference to be saved
    await page.waitForLoadState('networkidle')

    // Reload and check persistence
    await page.reload()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('.theme-btn', { hasText: 'Dark' })).toHaveClass(/theme-btn-active/)
  })

  test('only one theme button is active at a time', async ({ page }) => {
    // Click Dark
    await page.locator('.theme-btn', { hasText: 'Dark' }).click()
    await expect(page.locator('.theme-btn-active')).toHaveCount(1)
    await expect(page.locator('.theme-btn', { hasText: 'Dark' })).toHaveClass(/theme-btn-active/)

    // Click Light
    await page.locator('.theme-btn', { hasText: 'Light' }).click()
    await expect(page.locator('.theme-btn-active')).toHaveCount(1)
    await expect(page.locator('.theme-btn', { hasText: 'Light' })).toHaveClass(/theme-btn-active/)

    // Click System
    await page.locator('.theme-btn', { hasText: 'System' }).click()
    await expect(page.locator('.theme-btn-active')).toHaveCount(1)
    await expect(page.locator('.theme-btn', { hasText: 'System' })).toHaveClass(/theme-btn-active/)
  })
})
