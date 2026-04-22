# step-4 を step-5 に成長させるプロンプト

以下のプロンプトを順番に AI エージェントに渡して、既存の Next.js + NestJS + Prisma プロジェクトにメール/パスワード認証（JWT）とユーザースコープのアイテムを追加します。

## 1. Prisma スキーマに User モデルを追加

`backend/prisma/user.prisma` に、`id`（cuid）、`email`（unique）、`name`（optional）、`passwordHash`（optional）、`createdAt`、`updatedAt` を持つ User モデルを作成してください。既存の Item モデルに `userId` フィールドと `user` リレーションを追加して、アイテムがユーザーにスコープされるようにしてください。

## 2. バックエンドに認証依存関係を追加

バックエンドの `package.json` に `@nestjs/jwt`、`@nestjs/passport`、`passport`、`passport-jwt`、`bcryptjs`（および `@types/bcryptjs`、`@types/passport-jwt` を devDependencies として）を追加してください。

## 3. PrismaService を更新して User モデルを公開

`backend/src/prisma/prisma.service.ts` を更新して、`this.client.user` を公開する `user` ゲッターを追加してください。

## 4. JWT ストラテジーと認証ガードを作成

`backend/src/auth/strategies/jwt.strategy.ts` を作成してください。Authorization Bearer ヘッダーから JWT を抽出し、`AUTH_JWT_SECRET` で検証し、`{ userId, email }` を `req.user` に返してください。`backend/src/auth/guards/jwt-auth.guard.ts` で `AuthGuard('jwt')` を拡張してください。

## 5. 認証 DTO を作成

`backend/src/auth/dto/` 配下に DTO を作成してください：
- `signup.dto.ts` — email（IsEmail）、password（MinLength 8）、optional name
- `signin.dto.ts` — email（IsEmail）、password（IsString）
- `refresh.dto.ts` — refreshToken（IsString）

## 6. AuthService を作成

`backend/src/auth/auth.service.ts` を以下のメソッドで作成してください：
- `signUp(dto)` — bcrypt でパスワードをハッシュ化、ユーザー作成、JWT トークンを返す
- `signIn(dto)` — メール/パスワードを検証、JWT トークンを返す
- `refresh(refreshToken)` — リフレッシュトークンを検証、新しい JWT トークンを返す
- `deleteAccount(userId)` — ユーザーを削除
- プライベート `buildTokenResponse(user)` — `AUTH_JWT_SECRET` と `AUTH_JWT_REFRESH_SECRET` 環境変数を使用してアクセスとリフレッシュ JWT に署名

## 7. AuthController を作成

`backend/src/auth/auth.controller.ts` を以下のエンドポイントで作成してください：
- `POST /auth/signup` — メール/パスワードで登録
- `POST /auth/signin` — サインイン、トークンを返す
- `POST /auth/refresh` — トークンをリフレッシュ
- `GET /auth/me` — 現在のユーザーを取得（JWT 保護）
- `DELETE /auth/account` — アカウント削除（JWT 保護）
すべてのエンドポイントに Swagger デコレーターを含めてください。

## 8. AuthModule を作成し登録

`backend/src/auth/auth.module.ts` を作成して `PassportModule` と `JwtModule` をインポートし、`AuthService` と `JwtStrategy` を提供してください。次に `backend/src/app.module.ts` を更新して `AuthModule` をインポートしてください。

## 9. ItemsController に JWT 認証ガードを追加

`backend/src/items/items.controller.ts` を更新して、すべてのエンドポイントに `@UseGuards(JwtAuthGuard)` を使用してください。`req.user.userId` をサービスメソッドに渡して、アイテムが認証ユーザーにスコープされるようにしてください。`items.service.ts` を更新して、create、findAll（userId でフィルター）、delete（所有権チェック）で `userId` を使用してください。

## 10. 環境ファイルに JWT シークレットを追加

`.secrets.env` と `.example.secrets.env` に `AUTH_JWT_SECRET` と `AUTH_JWT_REFRESH_SECRET` を追加してください。

## 11. IaC の Secrets Manager に JWT シークレットを追加

既存の `iac/aws/secrets-manager.tf`（`DATABASE_URL` がある）に `AUTH_JWT_SECRET` と `AUTH_JWT_REFRESH_SECRET` シークレットを追加してください。IAM ポリシーを更新して新しいシークレット ARN を含めてください。`iac/aws/outputs.tf` に `secret_jwt_secret_arn` と `secret_jwt_refresh_secret_arn` 出力を追加してください。`iac/aws/ephemeral/ecs-express-backend.tf` のバックエンド ECS サービスを更新して、`AUTH_JWT_SECRET` と `AUTH_JWT_REFRESH_SECRET` の `secret` ブロックを追加してください。

## 12. フロントエンドの AuthContext を作成

`web/app/contexts/AuthContext.tsx` を作成してください。localStorage で JWT トークンを管理し、React コンテキスト経由で `user`、`accessToken`、`loading`、`login()`、`logout()` を提供してください。マウント時に保存されたリフレッシュトークンを使用してトークンを自動リフレッシュしてください。

## 13. サインイン・サインアップページを作成

以下を作成してください：
- `web/app/app/signin/page.tsx` — メール/パスワードのサインインフォーム、成功時にダッシュボードにリダイレクト
- `web/app/app/signup/page.tsx` — メール/パスワードのサインアップフォーム、自動ログインしてダッシュボードにリダイレクト

## 14. ダッシュボードとアイテムページを作成

以下を作成してください：
- `web/app/app/dashboard/page.tsx` — ユーザープロフィール表示（ID、メール、登録日）、認証保護
- `web/app/app/items/page.tsx` — JWT 認証付きアイテム CRUD（作成、一覧、削除）、認証保護
- `web/app/components/AppHeader.tsx` — ダッシュボード、アイテムリンクとサインアウトボタン付きナビゲーションバー

## 15. ルートページとレイアウトを更新

`web/app/app/page.tsx` を更新して、認証ユーザーを `/dashboard` に、未認証ユーザーを `/signin` にリダイレクトしてください。`web/app/app/layout.tsx` を更新して children を `AuthProvider` でラップしてください。認証フォーム、カード、ダッシュボード、アイテムリスト用のグローバルスタイルを追加してください。

## 16. API クライアントと E2E テストを更新

`web/app/lib/api.ts` を更新して、Bearer 認証ヘッダー付きの `signup`、`signin`、`getMe`、`refreshTokens`、`deleteAccount` 関数を追加してください。E2E テストを更新してください：スモークテストはサインインへのリダイレクトを確認、アイテムテストはサインアップ後のアイテム作成/削除フローをカバーしてください。
