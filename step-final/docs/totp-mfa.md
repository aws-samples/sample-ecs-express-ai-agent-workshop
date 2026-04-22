# TOTP Multi-Factor Authentication

This project supports TOTP (Time-based One-Time Password) as a second authentication factor. Users can enable MFA from the settings page using any standard authenticator app (Google Authenticator, Authy, 1Password, etc.).

## How it works

### Setup flow

1. User navigates to **Settings > Two-factor authentication** and clicks **Enable**.
2. Backend generates a TOTP secret and returns an `otpauth://` URI.
3. Web client displays a QR code and the secret as text for manual entry.
4. User scans the QR code with their authenticator app and enters the 6-digit code.
5. Backend verifies the code, enables TOTP, and returns 8 one-time recovery codes.
6. User saves the recovery codes in a safe place.

### Sign-in flow (TOTP enabled)

```
Client                          Backend
  |                               |
  |-- POST /auth/signin --------->|
  |   { email, password }         |
  |                               |-- validate credentials
  |<-- { requiresMfa, mfaToken } -|   (TOTP enabled → short-lived MFA token)
  |                               |
  |-- POST /auth/totp/verify ---->|
  |   { mfaToken, code }          |
  |                               |-- validate TOTP or recovery code
  |<-- { accessToken, ... } ------|
```

For OAuth sign-in, the backend redirects with `?mfaToken=...` instead of `?accessToken=...&refreshToken=...`. The web client detects this in the OAuth callback page and redirects to the sign-in page to show the MFA challenge.

### Recovery codes

- 8 codes generated during TOTP setup, each an 8-character hex string.
- Stored as **bcrypt hashes** in the database — plaintext codes are shown once and never stored.
- Each code can be used exactly once as a substitute for a TOTP code during sign-in.
- Users can regenerate recovery codes from the settings page (requires a valid TOTP code).

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/totp/setup` | JWT | Generate TOTP secret and `otpauth://` URI |
| `POST` | `/auth/totp/enable` | JWT | Verify code and enable TOTP; returns recovery codes |
| `POST` | `/auth/totp/disable` | JWT | Verify code and disable TOTP |
| `POST` | `/auth/totp/verify` | None | Exchange MFA token + TOTP/recovery code for access tokens |
| `POST` | `/auth/totp/recovery-codes` | JWT | Regenerate recovery codes (requires valid TOTP code) |

### Request/response examples

**Setup:**
```json
// POST /auth/totp/setup (Authorization: Bearer <jwt>)
// Response 200
{ "secret": "JBSWY3DPEHPK3PXP...", "uri": "otpauth://totp/OAuth2App:user@example.com?..." }
```

**Enable:**
```json
// POST /auth/totp/enable (Authorization: Bearer <jwt>)
// Request
{ "code": "123456" }
// Response 200
{ "recoveryCodes": ["a1b2c3d4", "e5f6a7b8", ...] }
```

**Sign-in with MFA:**
```json
// POST /auth/signin
// Response 201 (TOTP enabled)
{ "requiresMfa": true, "mfaToken": "eyJ..." }

// POST /auth/totp/verify
// Request
{ "mfaToken": "eyJ...", "code": "123456" }
// Response 200
{ "accessToken": "eyJ...", "refreshToken": "eyJ...", "user": { ... } }
```

## Database fields

Three fields on the `User` model:

| Field | Type | Description |
|-------|------|-------------|
| `totpSecret` | `String?` | Base32-encoded TOTP secret |
| `totpEnabled` | `Boolean` | Whether TOTP is active (default `false`) |
| `recoveryCodes` | `Json?` | Array of bcrypt-hashed recovery codes |

The `getMe` endpoint and token responses include `totpEnabled` but never expose `totpSecret` or `recoveryCodes`.

## Client implementations

TOTP MFA is fully implemented across all platforms:

| Platform | Sign-in MFA challenge | Settings setup/disable | Recovery codes |
|----------|----------------------|----------------------|----------------|
| Web (Next.js) | `app/signin/page.tsx` | `app/settings/page.tsx` | Display + regenerate |

### Sign-in flow

All clients handle two cases when `POST /auth/signin` returns:

1. **Normal response** (`accessToken` + `refreshToken`): proceed to dashboard.
2. **MFA response** (`requiresMfa: true` + `mfaToken`): show a TOTP code input screen. Submit code via `POST /auth/totp/verify`.

### OAuth sign-in bypasses MFA

OAuth/social sign-in (Apple, Discord, GitHub, Google, X) **bypasses TOTP MFA**. The rationale is that social providers may already enforce their own MFA, so requiring a second TOTP challenge would be redundant. The backend's `findOrCreate*User()` methods return tokens directly without checking `totpEnabled`.

### Settings page MFA section

All clients implement the same state machine for the MFA section in settings:

- **Idle (disabled)**: "Enable" button → calls `POST /auth/totp/setup`
- **Setup**: Display secret (and QR code on web) + code input → calls `POST /auth/totp/enable`
- **Recovery codes**: Display 8 codes → user confirms saved
- **Idle (enabled)**: "Disable" and "Regenerate recovery codes" buttons
- **Disable**: Code input → calls `POST /auth/totp/disable`
- **Regenerate**: Code input → calls `POST /auth/totp/recovery-codes`

The TOTP verify endpoint accepts both 6-digit TOTP codes and 8-character hex recovery codes.

## Security considerations

### TOTP secret storage

**The `totpSecret` field is stored as plaintext Base32 in the database.** This is a common approach used by many applications, but it has implications:

- **Risk:** If the database is compromised, an attacker with access to `totpSecret` values can generate valid TOTP codes, effectively bypassing the second factor.
- **Mitigating factors:** An attacker would also need the user's password (or an active session) to exploit a stolen TOTP secret. The secret alone does not grant access.
- **Defense-in-depth option:** For production deployments with stricter security requirements, encrypt `totpSecret` at the application level using AES-256-GCM with a key stored in a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault). This ensures database compromise alone is insufficient to bypass MFA.

### MFA token

The MFA token is a short-lived JWT (5-minute expiry) with `purpose: "mfa"`. It is signed with the same `AUTH_JWT_SECRET` used for access tokens. The `totpVerify` method validates both the signature and the `purpose` claim to prevent misuse of other token types.

### TOTP parameters

| Parameter | Value |
|-----------|-------|
| Algorithm | SHA1 |
| Digits | 6 |
| Period | 30 seconds |
| Validation window | ±1 period (handles minor clock skew) |

These are the standard defaults supported by all major authenticator apps.
