# Prompts to grow step-4 into step-5

Use the following prompts in order with the AI agent to add email/password authentication (JWT) with user-scoped items to the existing Next.js + NestJS + Prisma project.

## 1. Add User model to Prisma schema

Could you create `backend/prisma/user.prisma` with a User model that has `id` (cuid), `email` (unique), `name` (optional), `passwordHash` (optional), `createdAt`, and `updatedAt`? Add a `userId` field and `user` relation to the existing Item model so items are scoped to users.

## 2. Add auth dependencies to the backend

Could you add `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, and `bcryptjs` (plus `@types/bcryptjs` and `@types/passport-jwt` as devDependencies) to the backend `package.json`?

## 3. Update PrismaService to expose the User model

Could you update `backend/src/prisma/prisma.service.ts` to add a `user` getter that exposes `this.client.user`?

## 4. Create a JWT strategy and auth guard

Could you create `backend/src/auth/strategies/jwt.strategy.ts` that extracts the JWT from the Authorization Bearer header, verifies it with `AUTH_JWT_SECRET`, and returns `{ userId, email }` to `req.user`? Also create `backend/src/auth/guards/jwt-auth.guard.ts` that extends `AuthGuard('jwt')`.

## 5. Create auth DTOs

Could you create DTOs under `backend/src/auth/dto/`:
- `signup.dto.ts` — email (IsEmail), password (MinLength 8), optional name
- `signin.dto.ts` — email (IsEmail), password (IsString)
- `refresh.dto.ts` — refreshToken (IsString)

## 6. Create the AuthService

Could you create `backend/src/auth/auth.service.ts` with these methods:
- `signUp(dto)` — hash password with bcrypt, create user, return JWT tokens
- `signIn(dto)` — verify email/password, return JWT tokens
- `refresh(refreshToken)` — verify refresh token, return new JWT tokens
- `deleteAccount(userId)` — delete user
- Private `buildTokenResponse(user)` — signs access and refresh JWTs using `AUTH_JWT_SECRET` and `AUTH_JWT_REFRESH_SECRET` env vars

## 7. Create the AuthController

Could you create `backend/src/auth/auth.controller.ts` with endpoints:
- `POST /auth/signup` — register with email/password
- `POST /auth/signin` — sign in, returns tokens
- `POST /auth/refresh` — refresh tokens
- `GET /auth/me` — get current user (JWT protected)
- `DELETE /auth/account` — delete account (JWT protected)
Include Swagger decorators on all endpoints.

## 8. Create the AuthModule and register it

Could you create `backend/src/auth/auth.module.ts` that imports `PassportModule` and `JwtModule`, provides `AuthService` and `JwtStrategy`? Then update `backend/src/app.module.ts` to import `AuthModule`.

## 9. Add JWT auth guards to ItemsController

Could you update `backend/src/items/items.controller.ts` to use `@UseGuards(JwtAuthGuard)` on all endpoints? Pass `req.user.userId` to the service methods so items are scoped to the authenticated user. Update `items.service.ts` to use `userId` for create, findAll (filter by userId), and delete (ownership check).

## 10. Add JWT secrets to environment files

Could you add `AUTH_JWT_SECRET` and `AUTH_JWT_REFRESH_SECRET` to `.secrets.env` and `.example.secrets.env`?

## 11. Add JWT secrets to Secrets Manager in IaC

Could you add `AUTH_JWT_SECRET` and `AUTH_JWT_REFRESH_SECRET` secrets to the existing `iac/aws/secrets-manager.tf` (which already has `DATABASE_URL`)? Update the IAM policy to include the new secret ARNs. Add `secret_jwt_secret_arn` and `secret_jwt_refresh_secret_arn` outputs to `iac/aws/outputs.tf`. Update the backend ECS service in `iac/aws/ephemeral/ecs-express-backend.tf` to add `secret` blocks for `AUTH_JWT_SECRET` and `AUTH_JWT_REFRESH_SECRET`.

## 12. Create an AuthContext for the frontend

Could you create `web/app/contexts/AuthContext.tsx` that manages JWT tokens in localStorage, provides `user`, `accessToken`, `loading`, `login()`, and `logout()` via React context? It should auto-refresh tokens on mount using the stored refresh token.

## 13. Create sign-in and sign-up pages

Could you create:
- `web/app/app/signin/page.tsx` — email/password sign-in form, redirects to dashboard on success
- `web/app/app/signup/page.tsx` — email/password sign-up form, auto-login and redirect to dashboard on success

## 14. Create dashboard and items pages

Could you create:
- `web/app/app/dashboard/page.tsx` — shows user profile (ID, email, joined date), protected by auth
- `web/app/app/items/page.tsx` — items CRUD with JWT auth (create, list, delete), protected by auth
- `web/app/components/AppHeader.tsx` — navigation bar with Dashboard, Items links and Sign out button

## 15. Update the root page and layout

Could you update `web/app/app/page.tsx` to redirect authenticated users to `/dashboard` and unauthenticated users to `/signin`? Update `web/app/app/layout.tsx` to wrap children with `AuthProvider`. Add global styles for auth forms, cards, dashboard, and items list.

## 16. Update API client and E2E tests

Could you update `web/app/lib/api.ts` to add `signup`, `signin`, `getMe`, `refreshTokens`, and `deleteAccount` functions with Bearer auth headers? Update E2E tests: smoke test checks redirect to sign-in, items test covers sign-up then create/delete items flow.
