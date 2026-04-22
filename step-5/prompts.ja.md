# step-5 を step-final に成長させるプロンプト

以下のプロンプトを順番に AI エージェントに渡して、既存の認証済み Next.js + NestJS プロジェクトに OAuth2、メール認証、TOTP MFA、国際化を追加します。

## 1. Mailpit でメール送信を追加

バックエンドに `mail` モジュール（`backend/src/mail/`）を追加し、nodemailer（SMTP）でメールを送信する `MailService` を作成してください。`compose.yaml` にローカル開発用の `mailpit` サービスを追加してください（SMTP ポート 1025、Web UI ポート 8025）。`.env` に SMTP 環境変数（`SMTP_HOST`、`SMTP_PORT`、`SMTP_SECURE`、`SMTP_USER`、`SMTP_FROM`）を追加してください。

## 2. サインアップにメール認証を追加

User モデルにメール認証フィールド（`emailVerified`、`emailVerificationToken`、`emailVerificationExpires`）を追加してください。サインアップフローを更新して、トークンリンク付きの認証メールを送信してください。`POST /auth/verify-email` と `POST /auth/resend-verification` エンドポイントを追加してください。`AUTH_REQUIRE_EMAIL_VERIFICATION` 環境変数でメール認証をオプションにしてください（デフォルト false）。

## 3. パスワードリセットフローを追加

User モデルにパスワードリセットフィールド（`passwordResetToken`、`passwordResetExpires`）を追加してください。リセットメールを送信しトークンを検証する `POST /auth/forgot-password` と `POST /auth/reset-password` エンドポイントを作成してください。対応する DTO とフロントエンドページ（`/reset-password`）を追加してください。

## 4. OAuth2 認証を追加（Apple、Discord、GitHub、Google、Twitter）

Apple、Discord、GitHub、Google、X（Twitter）OAuth2 の Passport ストラテジーを追加してください。各プロバイダーの Web およびネイティブバリアントの `GET /auth/{provider}` とコールバックエンドポイントを作成してください。AuthService に `findOrCreateSocialUser()` メソッドと `SocialAccount` Prisma モデルを追加してください。クライアント ID とシークレットの OAuth2 環境変数を追加してください。

## 5. アカウントリンク・リンク解除を追加

既存のアカウントに OAuth プロバイダーをリンク・リンク解除するエンドポイントを追加してください。リンク開始用の `GET /auth/link/{provider}` とリンク解除用の `DELETE /auth/link/{provider}` を追加してください。リンクフロー用のセッションベースの状態管理を含めてください。

## 6. TOTP MFA（二要素認証）を追加

User モデルに TOTP フィールド（`totpSecret`、`totpEnabled`、`recoveryCodes`）を追加してください。エンドポイントを作成してください：`POST /auth/totp/setup`、`/auth/totp/enable`、`/auth/totp/disable`、`/auth/totp/verify`、`/auth/totp/recovery-codes`。TOTP が有効な場合にサインインが `requiresMfa` を返すように更新してください。

## 7. 国際化（i18n）を追加

バックエンドに `nestjs-i18n` を追加し、英語と日本語の翻訳ファイルを作成してください。auth、items、users、validation メッセージの翻訳 JSON ファイルを作成してください。すべてのサービスを更新して、エラーメッセージに `I18nContext.current().t()` を使用してください。フロントエンドに言語切り替えコンポーネントを追加してください。

## 8. Users モジュールを追加

コントローラー（`GET /users`、`GET /users/:id`、`PATCH /users/:id`、`DELETE /users/:id`、`PATCH /users/me/preferences`）とサービスを持つ `UsersModule` を作成してください。User モデルに JSON として保存されるユーザー設定（テーマ）を含めてください。

## 9. すべての機能のフロントエンドページを追加

以下のフロントエンドページを追加してください：
- `/verify-email` — トークンによるメール認証
- `/reset-password` — パスワードリセットフォーム
- `/oauth/callback` — OAuth コールバックハンドラー
- `/settings` — メール管理、MFA セットアップ、連携アカウント、テーマセレクター、アカウント削除
- サインインページに OAuth サインインボタン
- 言語切り替えコンポーネント
- テーマコンテキストとダークモードサポート

## 10. すべてのバックエンドシークレットの Secrets Manager を追加

すべての OAuth クライアントシークレット（`AUTH_APPLE_PRIVATE_KEY`、`AUTH_DISCORD_CLIENT_SECRET`、`AUTH_GITHUB_CLIENT_SECRET`、`AUTH_GOOGLE_CLIENT_SECRET`、`AUTH_TWITTER_CLIENT_SECRET`）、セッションシークレット（`AUTH_SESSION_SECRET`）、SMTP パスワード（`SMTP_PASS`）の Secrets Manager シークレットを追加してください。バックエンド ECS サービスを更新して、すべての機密値に `secret` ブロックを使用してください。

## 11. OAuth 用セッション管理を追加

PostgreSQL バックのセッション用に `express-session` と `connect-pg-simple` を追加してください。これは OAuth2 CSRF 保護とアカウントリンク状態に必要です。`main.ts` にセッション設定を追加してください。

## 12. 包括的な E2E テストを追加

認証（サインアップ、サインイン、メール認証）、アイテム（認証付き CRUD）、テーマ切り替え、Git SHA 表示をカバーする E2E テストを追加してください。
