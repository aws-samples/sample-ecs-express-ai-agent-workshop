# step-0 を step-1 に成長させるプロンプト

以下のプロンプトを順番に AI エージェントに渡して、空の Next.js App Router プロジェクトを Docker Compose と Playwright E2E テスト付きでゼロから作成します。

## 1. Next.js 開発用の Dockerfile を作成

`Dockerfiles.d/web/Dockerfile` を `node:24-bookworm-slim` ベースで作成してください。git、pnpm（corepack 経由）、npm-check-updates、sort-package-json をインストールし、ホストの UID/GID に合わせた非 root の `developer` ユーザーを作成してください。

## 2. 環境設定と git 設定を作成

`.env` と `.example.env` をコンテナの UID/GID 設定（Docker Engine のみ、Docker Desktop は不要）で作成し、`.gitignore` で `*.env`（`.example.*` を除く）、`node_modules/`、`.pnpm-store/`、`.next/`、`.DS_Store`、`.vscode/` を無視するようにしてください。

## 3. Docker Compose ファイルを作成

`compose.yaml` を作成し、`Dockerfiles.d/web/Dockerfile` からビルドする `web` サービスを追加してください。`pnpm install && pnpm dev` を実行し、ポート 3000 を公開し、プロジェクトディレクトリをバインドマウントしてください。

## 4. Next.js App Router プロジェクトを作成

`web/app/` 配下に空の Next.js App Router プロジェクトを `create-next-app` で作成してください。TypeScript、ESLint、pnpm を使用し、Tailwind は不要です。ホストに Node.js がインストールされていないため、`docker compose run` 経由で実行してください。

## 5. Playwright E2E テスト用の Dockerfile を作成

`Dockerfiles.d/web-e2e-tests/Dockerfile` を Playwright イメージベースで作成し、pnpm サポートを含めて E2E テストを実行できるようにしてください。

## 6. Playwright E2E テストをセットアップ

`web/e2e-tests/` を作成し、`playwright.config.ts`（Chromium、`BASE_URL` 環境変数からの baseURL）、Playwright を依存関係に含む `package.json`、ホームページの読み込みを検証するスモークテストを作成してください。

## 7. Docker Compose に web-e2e-tests サービスを追加

`compose.yaml` に `web-e2e-tests` サービスを追加してください。`web` サービスが healthy であることに依存し（`web` にヘルスチェックを追加）、`e2e-tests` プロファイルで動作し、`pnpm install && pnpm test` を実行してください。

## 8. セットアップを検証

`docker compose --profile=e2e-tests run --rm web-e2e-tests` を実行して E2E テストがパスすることを確認してください。
