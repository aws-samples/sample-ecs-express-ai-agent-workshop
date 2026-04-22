# Prompts to grow step-5 into step-final

Use the following prompts in order with the AI agent to add OAuth2, email verification, TOTP MFA, and internationalization to the existing authenticated Next.js + NestJS project.

## 1. Add email sending with Mailpit

Could you add a `mail` module to the backend (`backend/src/mail/`) with a `MailService` that sends emails via nodemailer (SMTP)? Add a `mailpit` service to `compose.yaml` for local development (SMTP on port 1025, web UI on port 8025). Add SMTP environment variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_FROM`) to `.env`.

## 2. Add email verification to sign-up

Could you add email verification fields to the User model (`emailVerified`, `emailVerificationToken`, `emailVerificationExpires`)? Update the sign-up flow to send a verification email with a token link. Add `POST /auth/verify-email` and `POST /auth/resend-verification` endpoints. Make email verification optional via `AUTH_REQUIRE_EMAIL_VERIFICATION` env var (default false).

## 3. Add password reset flow

Could you add password reset fields to the User model (`passwordResetToken`, `passwordResetExpires`)? Create `POST /auth/forgot-password` and `POST /auth/reset-password` endpoints that send a reset email and validate the token. Add corresponding DTOs and frontend pages (`/reset-password`).

## 4. Add OAuth2 authentication (Apple, Discord, GitHub, Google, Twitter)

Could you add Passport strategies for Apple, Discord, GitHub, Google, and X (Twitter) OAuth2? Create `GET /auth/{provider}` and callback endpoints for each provider, both web and native variants. Add a `findOrCreateSocialUser()` method in AuthService and a `SocialAccount` Prisma model. Add OAuth2 environment variables for client IDs and secrets.

## 5. Add account linking and unlinking

Could you add endpoints to link and unlink OAuth providers to existing accounts? Add `GET /auth/link/{provider}` for initiating linking, and `DELETE /auth/link/{provider}` for unlinking. Include session-based state management for the linking flow.

## 6. Add TOTP MFA (two-factor authentication)

Could you add TOTP fields to the User model (`totpSecret`, `totpEnabled`, `recoveryCodes`)? Create endpoints: `POST /auth/totp/setup`, `/auth/totp/enable`, `/auth/totp/disable`, `/auth/totp/verify`, and `/auth/totp/recovery-codes`. Update sign-in to return `requiresMfa` when TOTP is enabled.

## 7. Add internationalization (i18n)

Could you add `nestjs-i18n` to the backend with English and Japanese translation files? Create translation JSON files for auth, items, users, and validation messages. Update all services to use `I18nContext.current().t()` for error messages. Add a language switcher component to the frontend.

## 8. Add a Users module

Could you create a `UsersModule` with a controller (`GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`, `PATCH /users/me/preferences`) and service? Include user preferences (theme) stored as JSON in the User model.

## 9. Add frontend pages for all features

Could you add frontend pages for:
- `/verify-email` — email verification with token
- `/reset-password` — password reset form
- `/oauth/callback` — OAuth callback handler
- `/settings` — email management, MFA setup, linked accounts, theme selector, account deletion
- OAuth sign-in buttons on the sign-in page
- Language switcher component
- Theme context and dark mode support

## 10. Add Secrets Manager for all backend secrets

Could you add Secrets Manager secrets for all OAuth client secrets (`AUTH_APPLE_PRIVATE_KEY`, `AUTH_DISCORD_CLIENT_SECRET`, `AUTH_GITHUB_CLIENT_SECRET`, `AUTH_GOOGLE_CLIENT_SECRET`, `AUTH_TWITTER_CLIENT_SECRET`), session secret (`AUTH_SESSION_SECRET`), and SMTP password (`SMTP_PASS`)? Update the backend ECS service to use `secret` blocks for all sensitive values.

## 11. Add session management for OAuth

Could you add `express-session` with `connect-pg-simple` for PostgreSQL-backed sessions? This is needed for OAuth2 CSRF protection and account linking state. Add session configuration to `main.ts`.

## 12. Add comprehensive E2E tests

Could you add E2E tests covering: auth (signup, signin, email verification), items (CRUD with authentication), theme switching, and Git SHA display?
