// Requests are proxied through the Next.js dev server via the /backend rewrite
// rule in next.config.js. Using a relative path means the same code works for
// browsers on the host (localhost:3000) and Playwright inside Docker (web:3000).
const API_BASE = '/backend'

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
}

export interface User {
  id: string
  email: string
  emailVerified: boolean
  appleId?: string | null
  githubId?: string | null
  googleId?: string | null
  twitterId?: string | null
  discordId?: string | null
  hasPassword?: boolean
  totpEnabled?: boolean
  socialEmails?: string[]
  preferences?: UserPreferences | null
  createdAt: string
  updatedAt: string
}

export interface MessageResponse {
  message: string
}

export interface SignUpResponse extends MessageResponse {
  requiresVerification: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface MfaRequiredResponse {
  requiresMfa: true
  mfaToken: string
}

export type SignInResponse = AuthResponse | MfaRequiredResponse

export interface Item {
  id: string
  name: string
  userId: string
  createdAt: string
  updatedAt: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? res.statusText)
  }
  return res.json()
}

export function signup(email: string, password: string): Promise<SignUpResponse> {
  return request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function verifyEmail(token: string): Promise<MessageResponse> {
  return request('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export function resendVerification(email: string): Promise<MessageResponse> {
  return request('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function forgotPassword(email: string): Promise<MessageResponse> {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function resetPassword(token: string, password: string): Promise<MessageResponse> {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

export function signin(email: string, password: string): Promise<SignInResponse> {
  return request('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getMe(accessToken: string): Promise<User> {
  return request('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function refreshTokens(refreshToken: string): Promise<AuthResponse> {
  return request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

export function updateEmail(accessToken: string, email: string): Promise<User> {
  return request('/auth/email', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ email }),
  })
}

export function unlinkProvider(accessToken: string, provider: string): Promise<User> {
  return request(`/auth/link/${provider}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function deleteAccount(accessToken: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/account`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? res.statusText)
  }
}

export function updatePreferences(accessToken: string, preferences: UserPreferences): Promise<User> {
  return request('/users/me/preferences', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(preferences),
  })
}

export function getItems(accessToken: string): Promise<Item[]> {
  return request('/items', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function createItem(accessToken: string, name: string): Promise<Item> {
  return request('/items', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name }),
  })
}

export async function deleteItem(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? res.statusText)
  }
}

// --- TOTP MFA ---

export function totpSetup(accessToken: string): Promise<{ secret: string; uri: string }> {
  return request('/auth/totp/setup', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export function totpEnable(accessToken: string, code: string): Promise<{ recoveryCodes: string[] }> {
  return request('/auth/totp/enable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ code }),
  })
}

export function totpDisable(accessToken: string, code: string): Promise<MessageResponse> {
  return request('/auth/totp/disable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ code }),
  })
}

export function totpVerify(mfaToken: string, code: string): Promise<AuthResponse> {
  return request('/auth/totp/verify', {
    method: 'POST',
    body: JSON.stringify({ mfaToken, code }),
  })
}

export function totpRegenerateRecoveryCodes(accessToken: string, code: string): Promise<{ recoveryCodes: string[] }> {
  return request('/auth/totp/recovery-codes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ code }),
  })
}
