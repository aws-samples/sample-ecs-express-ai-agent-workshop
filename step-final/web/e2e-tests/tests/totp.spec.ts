import { test, expect, Page } from '@playwright/test'
import * as OTPAuth from 'otpauth'

let counter = 0
function uniqueEmail(prefix = 'totp') {
  counter++
  return `${prefix}.${Date.now()}.${counter}@example.com`
}

const DEFAULT_PASSWORD = 'password123'
const MAILPIT_API_URL = process.env.MAILPIT_API_URL ?? 'http://mailpit:8025'
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://backend:4000'

function generateTotpCode(secret: string): string {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  })
  return totp.generate()
}

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

async function signInViaApi(email: string, password = DEFAULT_PASSWORD) {
  const res = await fetch(`${BACKEND_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return res.json()
}

async function signInOnPage(page: Page, email: string, password = DEFAULT_PASSWORD) {
  await page.goto('/signin')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(/\/dashboard/)
}

/**
 * Set up and enable TOTP for a user via the backend API.
 * Returns the TOTP secret and recovery codes.
 */
async function enableTotpViaApi(accessToken: string) {
  const setupRes = await fetch(`${BACKEND_URL}/auth/totp/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const setup = await setupRes.json()

  const code = generateTotpCode(setup.secret)
  const enableRes = await fetch(`${BACKEND_URL}/auth/totp/enable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ code }),
  })
  const enable = await enableRes.json()

  return { secret: setup.secret, recoveryCodes: enable.recoveryCodes }
}

// ---------------------------------------------------------------------------
// TOTP MFA: Sign-in challenge
// ---------------------------------------------------------------------------
test.describe('TOTP MFA sign-in', () => {
  const email = uniqueEmail('mfa-signin')
  let totpSecret: string
  let recoveryCodes: string[]

  test.beforeAll(async () => {
    await createVerifiedUser(email)
    const signin = await signInViaApi(email)
    const result = await enableTotpViaApi(signin.accessToken)
    totpSecret = result.secret
    recoveryCodes = result.recoveryCodes
  })

  test('shows MFA challenge after password sign-in', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()

    // Should show MFA challenge, not dashboard
    await expect(page.locator('#mfaCode')).toBeVisible()
    await expect(page.getByText('authenticator app')).toBeVisible()
  })

  test('completes sign-in with valid TOTP code', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('#mfaCode')).toBeVisible()

    const code = generateTotpCode(totpSecret)
    await page.locator('#mfaCode').fill(code)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(email)).toBeVisible()
  })

  test('shows error for invalid TOTP code', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('#mfaCode')).toBeVisible()

    await page.locator('#mfaCode').fill('000000')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('.error-msg')).toBeVisible()
  })

  test('allows sign-in with recovery code', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('#mfaCode')).toBeVisible()

    // Use the last recovery code (others might have been used)
    await page.locator('#mfaCode').fill(recoveryCodes[recoveryCodes.length - 1])
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/dashboard/)
  })
})

// ---------------------------------------------------------------------------
// TOTP MFA: Settings page setup
// ---------------------------------------------------------------------------
test.describe('TOTP MFA settings', () => {
  test('enables TOTP from settings page', async ({ page }) => {
    const email = uniqueEmail('mfa-setup')
    await createVerifiedUser(email)
    await signInOnPage(page, email)

    // Navigate to settings
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/)
    await page.waitForLoadState('networkidle')

    // Click "Enable" for MFA
    await page.getByRole('button', { name: 'Enable' }).click()

    // Should show QR code and secret
    await expect(page.getByText('QR code')).toBeVisible()
    await expect(page.locator('img[alt="TOTP QR Code"]')).toBeVisible()

    // Get the secret text from the code element
    const secretEl = page.locator('code')
    const secret = await secretEl.textContent()
    expect(secret).toBeTruthy()

    // Generate and enter TOTP code
    const code = generateTotpCode(secret!)
    await page.locator('input[inputmode="numeric"]').fill(code)
    await page.getByRole('button', { name: 'Verify and enable' }).click()

    // Should show recovery codes
    await expect(page.getByText('Save these codes')).toBeVisible()
    const codeElements = page.locator('code')
    const codeCount = await codeElements.count()
    expect(codeCount).toBe(8)

    // Click "I've saved these codes"
    await page.getByRole('button', { name: "I've saved these codes" }).click()

    // Should show "Enabled" badge
    await expect(page.getByText('Enabled')).toBeVisible()
  })

  test('disables TOTP from settings page', async ({ page }) => {
    const email = uniqueEmail('mfa-disable')
    await createVerifiedUser(email)
    const signin = await signInViaApi(email)
    const { secret } = await enableTotpViaApi(signin.accessToken)

    // Sign in with MFA
    await page.goto('/signin')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('#mfaCode')).toBeVisible()
    const loginCode = generateTotpCode(secret)
    await page.locator('#mfaCode').fill(loginCode)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/dashboard/)

    // Navigate to settings
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/)
    await page.waitForLoadState('networkidle')

    // Click "Disable"
    await page.getByRole('button', { name: 'Disable' }).first().click()

    // Enter TOTP code to confirm
    const disableCode = generateTotpCode(secret)
    await page.locator('input[inputmode="numeric"]').fill(disableCode)
    await page.getByRole('button', { name: 'Disable MFA' }).click()

    // Should show success message and "Enable" button
    await expect(page.locator('.success-msg')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enable' })).toBeVisible()

    // Sign out and verify normal sign-in works
    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.goto('/signin')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
