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

async function signUpAndSignIn(page: import('@playwright/test').Page, email: string) {
  await createVerifiedUser(email)
  await page.goto('/signin')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(DEFAULT_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(/\/dashboard/)
}

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------
test.describe('Items – access control', () => {
  test('unauthenticated access to /items redirects to /signin', async ({ page }) => {
    await page.goto('/items')
    await expect(page).toHaveURL(/\/signin/)
  })
})

// ---------------------------------------------------------------------------
// Items CRUD
// ---------------------------------------------------------------------------
test.describe('Items – CRUD', () => {
  const sharedEmail = uniqueEmail('items')

  test.beforeAll(async () => {
    await createVerifiedUser(sharedEmail)
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/signin')
    await page.locator('#email').fill(sharedEmail)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/dashboard/)

    // reactStrictMode:true causes React to mount→unmount→remount in dev,
    // firing useEffect (and therefore getItems) twice.  Both calls are in
    // flight simultaneously; waiting for only the first response would leave
    // the second one free to overwrite a just-created item.
    // waitForLoadState('networkidle') waits until ALL HTTP requests have
    // settled (HMR uses WebSocket, so it does not block networkidle).
    await page.goto('/items')
    await page.waitForLoadState('networkidle')
  })

  test('shows empty state when no items exist', async ({ page }) => {
    await expect(page.locator('.items-empty')).toBeVisible()
    await expect(page.locator('.items-empty')).toContainText('No items yet')
  })

  test('can create an item and it appears in the list', async ({ page }) => {
    const itemName = `Test item ${Date.now()}`

    await page.getByPlaceholder('Item name').fill(itemName)
    await page.locator('.items-form button[type="submit"]').click()

    await expect(page.locator('.item-name', { hasText: itemName })).toBeVisible()
    await expect(page.locator('.items-empty')).not.toBeVisible()
  })

  test('clears the input after adding an item', async ({ page }) => {
    await page.getByPlaceholder('Item name').fill('Cleared after add')
    await page.locator('.items-form button[type="submit"]').click()

    await expect(page.locator('.item-name', { hasText: 'Cleared after add' })).toBeVisible()
    await expect(page.getByPlaceholder('Item name')).toHaveValue('')
  })

  test('add button is disabled when input is empty', async ({ page }) => {
    const submitBtn = page.locator('.items-form button[type="submit"]')
    await expect(submitBtn).toBeDisabled()

    await page.getByPlaceholder('Item name').fill('  ')
    await expect(submitBtn).toBeDisabled()

    await page.getByPlaceholder('Item name').fill('Valid name')
    await expect(submitBtn).toBeEnabled()
  })

  test('can delete an item and it disappears from the list', async ({ page }) => {
    const itemName = `Delete me ${Date.now()}`

    await page.getByPlaceholder('Item name').fill(itemName)
    await page.locator('.items-form button[type="submit"]').click()
    await expect(page.locator('.item-name', { hasText: itemName })).toBeVisible()

    const itemRow = page.locator('.item-row', { has: page.locator('.item-name', { hasText: itemName }) })
    await itemRow.locator('.btn-danger').click()

    await expect(page.locator('.item-name', { hasText: itemName })).not.toBeVisible()
  })

  test('shows empty state after all items are deleted', async ({ page }) => {
    const itemName = `Only item ${Date.now()}`

    // Ensure empty before starting
    const existingRows = page.locator('.item-row')
    const count = await existingRows.count()
    for (let i = 0; i < count; i++) {
      await existingRows.first().locator('.btn-danger').click()
      await expect(existingRows).toHaveCount(count - i - 1)
    }

    await page.getByPlaceholder('Item name').fill(itemName)
    await page.locator('.items-form button[type="submit"]').click()
    await expect(page.locator('.item-name', { hasText: itemName })).toBeVisible()

    await page.locator('.item-row').locator('.btn-danger').click()
    await expect(page.locator('.items-empty')).toBeVisible()
  })

  test('can create multiple items and all appear in the list', async ({ page }) => {
    const ts = Date.now()
    const names = [`Alpha ${ts}`, `Beta ${ts}`, `Gamma ${ts}`]

    for (const name of names) {
      await page.getByPlaceholder('Item name').fill(name)
      await page.locator('.items-form button[type="submit"]').click()
      await expect(page.locator('.item-name', { hasText: name })).toBeVisible()
    }

    await expect(page.locator('.item-row')).toHaveCount(names.length)
  })
})

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
test.describe('Items – navigation', () => {
  test('AppHeader Items link navigates to /items', async ({ page }) => {
    await signUpAndSignIn(page, uniqueEmail('navitems'))
    await expect(page).toHaveURL(/\/dashboard/)

    await page.getByRole('link', { name: 'Items' }).click()
    await expect(page).toHaveURL(/\/items/)
  })

  test('AppHeader Dashboard link navigates back to /dashboard from /items', async ({ page }) => {
    await signUpAndSignIn(page, uniqueEmail('navdash'))
    await page.goto('/items')

    await page.getByRole('link', { name: 'Dashboard' }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
