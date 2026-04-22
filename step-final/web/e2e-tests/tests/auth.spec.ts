import { test, expect, Page } from '@playwright/test'

// Counter to guarantee unique emails even within the same millisecond
let counter = 0
function uniqueEmail(prefix = 'user') {
  counter++
  return `${prefix}.${Date.now()}.${counter}@example.com`
}

const DEFAULT_PASSWORD = 'password123'
const MAILPIT_API_URL = process.env.MAILPIT_API_URL ?? 'http://mailpit:8025'
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://backend:4000'

/**
 * Fetch the verification token for a given email from Mailpit API.
 */
async function getVerificationToken(email: string): Promise<string> {
  // Wait briefly for the email to arrive
  let token: string | undefined
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${MAILPIT_API_URL}/api/v1/search?query=to:${email}`)
    const data = await res.json()
    if (data.messages && data.messages.length > 0) {
      const msgId = data.messages[0].ID
      const msgRes = await fetch(`${MAILPIT_API_URL}/api/v1/message/${msgId}`)
      const msg = await msgRes.json()
      // Extract token from the verification URL in the HTML body
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

/**
 * Fetch the password reset token for a given email from Mailpit API.
 * Searches for the most recent "Reset your password" email.
 */
async function getPasswordResetToken(email: string): Promise<string> {
  let token: string | undefined
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${MAILPIT_API_URL}/api/v1/search?query=to:${email}`)
    const data = await res.json()
    if (data.messages && data.messages.length > 0) {
      // Find the password reset email (not verification email)
      for (const message of data.messages) {
        const msgRes = await fetch(`${MAILPIT_API_URL}/api/v1/message/${message.ID}`)
        const msg = await msgRes.json()
        const body = msg.HTML || msg.Text || ''
        if (body.includes('reset-password') || body.includes('Password Reset')) {
          const match = body.match(/[?&]token=([a-f0-9-]+)/)
          if (match) {
            token = match[1]
            break
          }
        }
      }
      if (token) break
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  if (!token) throw new Error(`Password reset email not found for ${email}`)
  return token
}

/**
 * Sign up via the UI, verify email via Mailpit, and sign in.
 * Returns the page on the dashboard.
 */
async function signUpAndVerify(page: Page, email: string, password = DEFAULT_PASSWORD) {
  // Sign up
  await page.goto('/signup')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('button[type="submit"]').click()

  // Should show verification sent message
  await expect(page.getByText('Check your email')).toBeVisible()

  // Get token from Mailpit and verify
  const token = await getVerificationToken(email)
  await page.goto(`/verify-email?token=${token}`)
  await expect(page.getByText('verified successfully')).toBeVisible()

  // Sign in
  await page.goto('/signin')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(/\/dashboard/)
}

/**
 * Create a verified user directly via the backend API (faster, for tests
 * that don't need to test the signup flow itself).
 */
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
// Sign up
// ---------------------------------------------------------------------------
test.describe('Sign up', () => {
  test('creates account, verifies email, and signs in to dashboard', async ({ page }) => {
    const email = uniqueEmail('signup')
    await signUpAndVerify(page, email)
    await expect(page.getByText(email)).toBeVisible()
  })

  test('shows verification sent page after signup', async ({ page }) => {
    const email = uniqueEmail('verifysent')

    await page.goto('/signup')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()

    await expect(page.getByText('Check your email')).toBeVisible()
    await expect(page.getByText('verification link')).toBeVisible()
  })

  test('shows error for duplicate email', async ({ page }) => {
    const email = uniqueEmail('dup')

    // First registration + verification
    await signUpAndVerify(page, email)

    // Sign out so we can try again
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/signin/)

    // Attempt registration with the same email
    await page.goto('/signup')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('.error-msg')).toBeVisible()
    await expect(page).toHaveURL(/\/signup/)
  })
})

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------
test.describe('Email verification', () => {
  test('shows error for invalid verification token', async ({ page }) => {
    await page.goto('/verify-email?token=invalid-token')
    await expect(page.locator('.error-msg')).toBeVisible()
  })

  test('shows error when no token is provided', async ({ page }) => {
    await page.goto('/verify-email')
    await expect(page.locator('.error-msg')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------
test.describe('Sign in', () => {
  // One shared user created before all tests in this block
  const sharedEmail = uniqueEmail('signin')

  test.beforeAll(async () => {
    await createVerifiedUser(sharedEmail)
  })

  test('signs in and redirects to dashboard', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('#email').fill(sharedEmail)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(sharedEmail)).toBeVisible()
  })

  test('shows error for unverified user', async ({ page }) => {
    const email = uniqueEmail('unverified')

    // Sign up but don't verify
    await fetch(`${BACKEND_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: DEFAULT_PASSWORD }),
    })

    await page.goto('/signin')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('.error-msg')).toBeVisible()
    await expect(page).toHaveURL(/\/signin/)
  })

  test('shows error for wrong password', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('#email').fill(sharedEmail)
    await page.locator('#password').fill('wrong_password')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('.error-msg')).toBeVisible()
    await expect(page).toHaveURL(/\/signin/)
  })

  test('shows error for non-existent email', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('#email').fill(`nonexistent.${Date.now()}@example.com`)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('.error-msg')).toBeVisible()
    await expect(page).toHaveURL(/\/signin/)
  })
})

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------
test.describe('Access control', () => {
  test('unauthenticated access to /dashboard redirects to /signin', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/signin/)
  })

  test('unauthenticated access to / redirects to /signin', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/signin/)
  })

  test('authenticated access to / redirects to /dashboard', async ({ page }) => {
    const email = uniqueEmail('indexauth')
    await signUpAndVerify(page, email)

    await page.goto('/')
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------
test.describe('Sign out', () => {
  test('signs out, redirects to /signin, and blocks dashboard access', async ({ page }) => {
    const email = uniqueEmail('signout')
    await signUpAndVerify(page, email)

    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/signin/)

    // Dashboard must be inaccessible after sign-out
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/signin/)
  })
})

// ---------------------------------------------------------------------------
// Delete account
// ---------------------------------------------------------------------------
test.describe('Delete account', () => {
  test('deletes account, redirects to /signin, and prevents sign-in', async ({ page }) => {
    const email = uniqueEmail('delete')
    await signUpAndVerify(page, email)

    // Navigate to settings
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/)
    await page.waitForLoadState('networkidle')

    // Accept the browser confirmation dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm')
      await dialog.accept()
    })

    // Click delete account button
    await page.getByRole('button', { name: 'Delete account' }).click()

    // Should redirect to sign-in
    await expect(page).toHaveURL(/\/signin/)

    // Attempting to sign in with the deleted email should fail
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('.error-msg')).toBeVisible()
    await expect(page).toHaveURL(/\/signin/)
  })
})

// ---------------------------------------------------------------------------
// Change email
// ---------------------------------------------------------------------------
test.describe('Change email', () => {
  test('changes email from settings, resets verification, and can verify new email', async ({ page }) => {
    const oldEmail = uniqueEmail('oldemail')
    const newEmail = uniqueEmail('newemail')
    await signUpAndVerify(page, oldEmail)

    // Navigate to settings
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/)
    await page.waitForLoadState('networkidle')

    // Should show current email as verified
    await expect(page.getByText(oldEmail)).toBeVisible()
    await expect(page.getByText('Verified')).toBeVisible()

    // Enter new email and save
    await page.locator('.email-combo-input').fill(newEmail)
    await page.getByRole('button', { name: 'Save' }).click()

    // Should show new email as unverified
    await expect(page.getByText(newEmail)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Unverified')).toBeVisible()

    // Verify the new email via Mailpit
    const token = await getVerificationToken(newEmail)
    await page.goto(`/verify-email?token=${token}`)
    await expect(page.getByText('verified successfully')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------
test.describe('Password reset', () => {
  test('resets password from settings and signs in with new password', async ({ page }) => {
    const email = uniqueEmail('pwreset')
    const newPassword = 'newpassword456'
    await signUpAndVerify(page, email)

    // Navigate to settings
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/)
    await page.waitForLoadState('networkidle')

    // Click "Send reset link" button
    await page.getByRole('button', { name: 'Send reset link' }).click()

    // Should show success message
    await expect(page.locator('.success-msg')).toBeVisible()

    // Get reset token from Mailpit
    const token = await getPasswordResetToken(email)

    // Navigate to reset password page
    await page.goto(`/reset-password?token=${token}`)
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible()

    // Fill new password and submit
    await page.locator('#password').fill(newPassword)
    await page.locator('button[type="submit"]').click()

    // Should show success message
    await expect(page.getByText('reset successfully')).toBeVisible()

    // Sign out (clear auth state) before trying to sign in with new password
    await page.evaluate(() => localStorage.removeItem('auth_tokens'))

    // Sign in with new password
    await page.goto('/signin')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(newPassword)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('shows error for invalid reset token', async ({ page }) => {
    await page.goto('/reset-password?token=invalid-token')

    await page.locator('#password').fill('newpassword456')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('.error-msg')).toBeVisible()
  })

  test('shows error when no token is provided', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.locator('.error-msg')).toBeVisible()
  })

  test('old password no longer works after reset', async ({ page }) => {
    const email = uniqueEmail('pwold')
    const newPassword = 'newpassword789'
    await signUpAndVerify(page, email)

    // Request password reset via API
    await fetch(`${BACKEND_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    // Reset password
    const token = await getPasswordResetToken(email)
    await page.goto(`/reset-password?token=${token}`)
    await page.locator('#password').fill(newPassword)
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('reset successfully')).toBeVisible()

    // Sign out (clear auth state) before trying to sign in
    await page.evaluate(() => localStorage.removeItem('auth_tokens'))

    // Old password should fail
    await page.goto('/signin')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(DEFAULT_PASSWORD)
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('.error-msg')).toBeVisible()
    await expect(page).toHaveURL(/\/signin/)
  })
})

// ---------------------------------------------------------------------------
// Forgot password from sign-in page
// ---------------------------------------------------------------------------
test.describe('Forgot password from sign-in page', () => {
  test('shows forgot password link on sign-in page', async ({ page }) => {
    await page.goto('/signin')
    await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeVisible()
  })

  test('shows error when clicking forgot password without entering email', async ({ page }) => {
    await page.goto('/signin')
    await page.getByRole('button', { name: 'Forgot password?' }).click()
    await expect(page.locator('.error-msg')).toBeVisible()
  })

  test('shows success message after requesting password reset', async ({ page }) => {
    const email = uniqueEmail('forgotpw')
    await createVerifiedUser(email)

    await page.goto('/signin')
    await page.locator('#email').fill(email)
    await page.getByRole('button', { name: 'Forgot password?' }).click()

    await expect(page.locator('.success-msg')).toBeVisible()
  })

  test('sends reset email and allows password reset from sign-in page', async ({ page }) => {
    const email = uniqueEmail('forgotflow')
    const newPassword = 'resetfromlogin123'
    await createVerifiedUser(email)

    // Request reset from sign-in page
    await page.goto('/signin')
    await page.locator('#email').fill(email)
    await page.getByRole('button', { name: 'Forgot password?' }).click()
    await expect(page.locator('.success-msg')).toBeVisible()

    // Get reset token from Mailpit and reset password
    const token = await getPasswordResetToken(email)
    await page.goto(`/reset-password?token=${token}`)
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible()
    await page.locator('#password').fill(newPassword)
    await page.locator('button[type="submit"]').click()
    await expect(page.getByText('reset successfully')).toBeVisible()

    // Sign in with new password
    await page.goto('/signin')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(newPassword)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('shows success even for non-existent email (no enumeration)', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('#email').fill(`nonexistent.${Date.now()}@example.com`)
    await page.getByRole('button', { name: 'Forgot password?' }).click()

    // Should still show success to prevent email enumeration
    await expect(page.locator('.success-msg')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Page navigation
// ---------------------------------------------------------------------------
test.describe('Page navigation', () => {
  test('sign-in page has a link to sign-up', async ({ page }) => {
    await page.goto('/signin')
    await expect(page.locator('a[href="/signup"]')).toBeVisible()
  })

  test('sign-up page has a link to sign-in', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('sign-up page has a forgot password link', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible()
  })
})
