# Step 0 — ゼロからスタート

空のディレクトリです。プロンプトを使って、Docker Compose と Playwright E2E テストを含む Next.js プロジェクトを作成します。

## 前提条件

- Docker Engine + Docker Compose（例: [Docker Desktop](https://www.docker.com/products/docker-desktop/)、[Podman](https://podman.io/)、[Colima](https://github.com/abiosoft/colima)）
- AI コーディングエージェント（例: [Claude Code](https://claude.ai/claude-code)）

## はじめに

このディレクトリの [prompts.ja.md](prompts.ja.md) の内容をコピーして AI エージェント（[Claude Code](https://claude.ai/claude-code)、[Cursor](https://www.cursor.com/)、[GitHub Copilot](https://github.com/features/copilot)、[ChatGPT](https://chatgpt.com/) など）に渡してください。正しく実行されれば、手動の作業なしで step-1 と同等の環境が構築されます。

<details>
<summary><strong>用語解説：Next.js、E2E テスト、コンテナ、Docker、Docker Compose（クリックで展開）</strong></summary>

**Next.js とは？**

[Next.js](https://nextjs.org/) は、フルスタック Web アプリケーションを構築するための React ベースの Web フレームワークです。サーバーサイドレンダリング、ファイルベースルーティング、組み込みの API ルートを提供し、モダンな Web 開発で最も人気のある選択肢の一つです。本ワークショップでは、Next.js をフロントエンドとして使用します。

**E2E テストとは？**

E2E（エンドツーエンド）テストは、アプリケーションに対する実際のユーザー操作をシミュレートします — ブラウザを開き、ボタンをクリックし、フォームに入力し、結果を検証します。[Playwright](https://playwright.dev/) は、ブラウザ操作を自動化するモダンな E2E テストフレームワークです。E2E テストを書くことで、AI エージェントが生成したコードが期待通りに動作することを確認できます。

**コンテナとは？**

コンテナは、アプリケーションコードとそのすべての依存関係（ランタイム、ライブラリ、OS ツール）を軽量でポータブルなパッケージにまとめたもので、ローカル PC、同僚のマシン、クラウドなど、どこでも同じように動作します。[Docker](https://www.docker.com/) はコンテナのビルドと実行に最も広く使われているツールです。

**Docker とは？**

[Docker](https://www.docker.com/) は、コンテナをビルドし実行するためのプラットフォームです。`Dockerfile` にアプリケーション環境のセットアップ方法を記述すると、Docker がそれをどこでも実行できるイメージにビルドします。本ワークショップでは、各サービスが `Dockerfiles.d/` 配下に独自の Dockerfile を持っています。

**Docker Compose とは？**

[Docker Compose](https://docs.docker.com/compose/) は、マルチコンテナアプリケーションを定義・実行するためのツールです。すべてのサービス（Web サーバー、データベース、テストランナーなど）を 1 つの `compose.yaml` ファイルに記述し、`docker compose up` の一つのコマンドですべてを起動できます。本ワークショップでは、すべてのステップで Docker Compose を使用して開発環境を実行します。

</details>

## 完了後の期待される出力

プロンプトを完了すると、step-1 と同等のプロジェクトが構築されます：

- `docker compose up` で Next.js 開発サーバーが起動
- **http://localhost:3000** — デフォルトの Next.js「Create Next App」ランディングページ
- `docker compose --profile=e2e-tests run --rm web-e2e-tests` — Playwright E2E テストがパス

---

[次へ: step-1 — 空の Next.js アプリ](../step-1/README.ja.md)
