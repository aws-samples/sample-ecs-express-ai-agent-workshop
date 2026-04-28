# step-2 を step-3 に成長させるプロンプト

以下のプロンプトを順番に AI エージェントに渡して、既存の Next.js + AWS IaC プロジェクトに最小限の NestJS バックエンド（Git SHA 付きヘルスチェック）を追加します。

## 1. 最小限の NestJS バックエンドを作成

`backend/` 配下にヘルスチェックエンドポイントのみを持つ NestJS バックエンドを作成してください：
- `GET /health` は `{ "status": "ok", "gitSha": "<GIT_SHA>" }` を返す（`GIT_SHA` 環境変数から）
- `GIT_SHA` が設定されていない場合は HTTP 503 を返す
- `/api` に Swagger UI を含める（非本番環境のみ）
- 最小限の依存関係を使用（データベースなし、認証なし、メールなし）
- `nest-cli.json`、`tsconfig.json`、`tsconfig.build.json`、`package.json` を含める
- TypeScript 6 を使用 — `tsconfig.json` で `rootDir`（例: `"."`）を明示的に設定し、NestJS 用に `experimentalDecorators` を使用すること

## 2. バックエンドの Dockerfile を追加（開発用と本番用）

`Dockerfiles.d/backend-build/Dockerfile` に、NestJS バックエンドをマルチステージビルドで構築する本番用 Dockerfile を作成してください。ビルドに `node:24-bookworm-slim`、ランタイムに `gcr.io/distroless/nodejs24-debian12:nonroot` を使用し、`GIT_SHA` ビルド引数を受け入れ、`nest build` を実行し、dev 依存関係を prune して、ポート 4000 で `dist/main` を実行する最小限の最終イメージを生成してください。

## 3. バックエンド開発用の Dockerfile を追加

`Dockerfiles.d/backend/Dockerfile` にローカル開発用の Dockerfile を作成してください。`node:24-bookworm-slim` ベースで、git、pnpm（corepack 経由）、npm-check-updates、sort-package-json をインストールしてください。`Dockerfiles.d/web/Dockerfile` のパターンに合わせてください。

## 4. compose.yaml にバックエンドサービスを追加

`compose.yaml` に `backend` サービスを追加してください：
- `Dockerfiles.d/backend/Dockerfile` を使用
- コンテナ起動時に `git rev-parse --short HEAD` から `GIT_SHA` を設定
- `pnpm install && pnpm dev` を実行
- ポート 4000 を公開しヘルスチェックを追加
- `web` サービスが `backend`（healthy）に依存し、`BACKEND_URL=http://backend:4000` を渡す
- `web-e2e-tests` にも `BACKEND_URL=http://backend:4000` を渡す

## 5. Next.js アプリを更新してバックエンドの Git SHA を表示

`web/app/next.config.ts` に `/backend/*` を `BACKEND_URL` にプロキシするリライトルールを追加してください。次に `web/app/app/page.tsx` を更新して `GET /backend/health` をフェッチし、ホームページにバックエンドの Git SHA を表示してください。

## 6. バックエンド統合の E2E テストを更新

`web/e2e-tests/tests/smoke.spec.ts` を更新して、ホームページにバックエンドの Git SHA が表示されること（「loading...」のままでないこと）を検証してください。

## 7. 永続 IaC にバックエンド ECR リポジトリを追加

`iac/aws/ecr.tf` にバックエンドイメージ用の `aws_ecr_repository` を追加し、`iac/aws/outputs.tf` に `ecr_backend_repository_url` 出力を追加してください。

## 8. 永続 IaC にバックエンドセキュリティグループを追加

`iac/aws/vpc-network.tf` に ECS バックエンドタスク用の `aws_security_group`（ポート 4000）を追加し、`iac/aws/outputs.tf` に `sg_ecs_backend_id` 出力を追加してください。

## 9. エフェメラル IaC にバックエンド ECS Express Gateway サービスを追加

`iac/aws/ephemeral/ecs-express-backend.tf` にバックエンド用の `aws_ecs_express_gateway_service` を作成してください（ポート 4000、`/health` でヘルスチェック、256 CPU、512 MiB メモリ、1-2 タスクのオートスケーリング）。`backend_url` 変数と出力を追加し、`remote-state.tf` の locals を更新してください。

## 10. IaC ワークフローの環境変数を更新

`.github/workflows/iac.ephemeral.yaml` を更新して `TF_VAR_backend_url` を渡し、`compose.yaml` の iac サービスで `TF_VAR_backend_url` を渡すようにしてください。

## 11. .env にバックエンド URL 変数を追加

`.env` と `.example.env` の Terraform 変数セクションに `FRONTEND_URL` と並べて `BACKEND_URL` を追加してください。
