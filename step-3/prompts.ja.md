# step-3 を step-4 に成長させるプロンプト

以下のプロンプトを順番に AI エージェントに渡して、既存の Next.js + NestJS プロジェクトに PostgreSQL、Prisma ORM、Items CRUD を追加します。

## 1. Docker Compose に PostgreSQL を追加

`compose.yaml` に `postgres:17-alpine` を使用する `db` サービスを追加してください。データベース名 `app`、ユーザー `postgres`、パスワード `password`、ヘルスチェック、データ永続化用の名前付きボリュームを設定してください。`backend` サービスが `db` の healthy に依存するようにしてください。

## 2. DATABASE_URL のシークレット env ファイルを追加

`.example.secrets.env` と `.secrets.env` を `DATABASE_URL=postgresql://postgres:password@db:5432/app` と `TF_VAR_database_password=change-me-database-password` で作成してください。`compose.yaml` のバックエンドの `env_file` に `.secrets.env` を追加してください。

## 3. バックエンドに Prisma ORM v7 を追加

バックエンドの `package.json` に `@prisma/client@^7`、`@prisma/adapter-pg@^7`、`pg` を dependencies として、`prisma@^7` を devDependency として追加してください。DTO バリデーション用に `class-validator` と `class-transformer` も追加してください。`postinstall`、`prisma:generate`、`prisma:push` スクリプトを追加してください。`prisma/config` の `defineConfig` を使用して、スキーマディレクトリを `prisma/` に設定し環境から `DATABASE_URL` を読み取る `prisma.config.mjs` を作成してください。

## 4. Item モデルの Prisma スキーマを作成

`backend/prisma/` 配下にマルチファイルの Prisma スキーマを作成してください。`schema.prisma` で `prisma-client` ジェネレーター（Prisma v7 では `prisma-client-js` ではなく `prisma-client` を使用）を出力先 `../src/generated/prisma` で設定し、PostgreSQL データソースを設定してください。`item.prisma` に `id`（cuid）、`name`（String）、`createdAt`、`updatedAt` フィールドを持つ `Item` モデルを作成してください。

## 5. Prisma サービスとモジュールを作成

`backend/src/prisma/prisma.service.ts` を作成してください。`@prisma/adapter-pg` PostgreSQL アダプターで `PrismaClient` をラップし、`item` モデルを公開し、`OnModuleInit`/`OnModuleDestroy` を実装してください。`backend/src/prisma/prisma.module.ts` を `PrismaService` をエクスポートするグローバルモジュールとして作成してください。

## 6. Items モジュールを作成

`backend/src/items/` 配下に NestJS Items モジュールを作成してください：
- `items.module.ts` — コントローラーとサービスを宣言
- `items.controller.ts` — `POST /items`（作成）、`GET /items`（一覧）、`DELETE /items/:id`（ID で削除）、Swagger デコレーター付き
- `items.service.ts` — PrismaService を使用した CRUD 操作
- `dto/create-item.dto.ts` — `name` フィールドのバリデーション（IsString、IsNotEmpty）、Swagger デコレーター付き
- `entities/item.entity.ts` — Swagger デコレーター付きレスポンスエンティティ

認証不要 — アイテムはユーザーにスコープされません。

## 7. Items モジュールを登録しバリデーションを追加

`backend/src/app.module.ts` を更新して `PrismaModule` と `ItemsModule` をインポートしてください。`backend/src/main.ts` を更新して `transform: true` と `whitelist: true` のグローバル `ValidationPipe` を追加してください。

## 8. Prisma 用のバックエンド compose コマンドを更新

`compose.yaml` の `backend` コマンドを更新して、`pnpm dev` の前に `pnpm exec prisma generate` と `pnpm exec prisma db push --accept-data-loss` を実行するようにしてください。

## 9. Web アプリを更新してアイテム CRUD を表示

`web/app/app/page.tsx` を更新して、Git SHA 表示の下に Items セクションを追加してください。ロード時に `GET /backend/items` をフェッチし、`POST /backend/items` でアイテムを作成するフォーム、`DELETE /backend/items/:id` でアイテムを削除するボタンを実装してください。非 OK レスポンスを適切に処理してください。

## 10. アイテム E2E テストを追加

`web/e2e-tests/tests/items.spec.ts` を作成して、アイテムの作成、リストへの表示確認、削除、削除後の除去確認をテストしてください。

## 11. 永続 IaC に DATABASE_URL の Secrets Manager を追加

`iac/aws/secrets-manager.tf` に `DATABASE_URL` の Secrets Manager シークレットを作成し、ECS 実行ロールに `secretsmanager:GetSecretValue` アクセスを付与する IAM ポリシーを追加してください。`iac/aws/outputs.tf` に `secret_database_url_arn` 出力を追加してください。

## 12. IaC に RDS、プライベートサブネット、NAT ゲートウェイを追加

`iac/aws/vpc-network.tf` にプライベートサブネット（2 AZ）、プライベートルートテーブル、RDS セキュリティグループ（ポート 5432、バックエンド SG からのイングレス）を追加してください。対応する出力を `iac/aws/outputs.tf` に追加してください。

`iac/aws/ephemeral/rds.tf` にプライベートサブネット内の RDS PostgreSQL 17 インスタンス（`db.t4g.micro`）を作成してください。`iac/aws/ephemeral/vpc.tf` にプライベートサブネットが ECR にアクセスするための NAT ゲートウェイを作成してください。`database_password`、`database_name`、`database_user` 変数を追加してください。

## 13. エフェメラル IaC から Secrets Manager に DATABASE_URL を保存

`iac/aws/ephemeral/secret-versions.tf` を作成して、RDS エンドポイントから `DATABASE_URL` シークレットを自動入力してください。`ecs-express-backend.tf` のバックエンド ECS サービスを更新して、`DATABASE_URL` にプレーンな `environment` ブロックの代わりに `secret` ブロック（永続レイヤーの Secrets Manager ARN を参照）を使用してください。

## 14. データベースパスワードの IaC ワークフローを更新

エフェメラル IaC ワークフローの環境変数に `TF_VAR_database_password`（シークレットから）を追加してください。
