# Step 0 — ゼロからスタート

空のディレクトリです。プロンプトを使って、Docker Compose と Playwright E2E テストを含む Next.js プロジェクトを作成します。

## 前提条件

- Docker Engine + Docker Compose（例: [Docker Desktop](https://www.docker.com/products/docker-desktop/)、[Podman](https://podman.io/)、[Colima](https://github.com/abiosoft/colima)）
- AI コーディングエージェント（例: [Claude Code](https://claude.ai/claude-code)）

## はじめに

このディレクトリの [prompts.ja.md](prompts.ja.md) の内容をコピーして AI エージェント（[Claude Code](https://claude.ai/claude-code)、[Cursor](https://www.cursor.com/)、[GitHub Copilot](https://github.com/features/copilot)、[ChatGPT](https://chatgpt.com/) など）に渡してください。正しく実行されれば、手動の作業なしで step-1 と同等の環境が構築されます。

<details>
<summary><strong>用語解説：Next.js、E2E テスト（クリックで展開）</strong></summary>

**Next.js とは？**

[Next.js](https://nextjs.org/) は、フルスタック Web アプリケーションを構築するための React ベースの Web フレームワークです。サーバーサイドレンダリング、ファイルベースルーティング、組み込みの API ルートを提供し、モダンな Web 開発で最も人気のある選択肢の一つです。本ワークショップでは、Next.js をフロントエンドとして使用します。

**E2E テストとは？**

E2E（エンドツーエンド）テストは、アプリケーションに対する実際のユーザー操作をシミュレートします — ブラウザを開き、ボタンをクリックし、フォームに入力し、結果を検証します。[Playwright](https://playwright.dev/) は、ブラウザ操作を自動化するモダンな E2E テストフレームワークです。E2E テストを書くことで、AI エージェントが生成したコードが期待通りに動作することを確認できます。

</details>

<details>
<summary><strong>用語解説：コンテナ、Docker、Docker Compose（クリックで展開）</strong></summary>

**コンテナとは？**

コンテナは、アプリケーションコードとそのすべての依存関係（ランタイム、ライブラリ、OS ツール）を軽量でポータブルなパッケージにまとめたもので、ローカル PC、同僚のマシン、クラウドなど、どこでも同じように動作します。[Docker](https://www.docker.com/) はコンテナのビルドと実行に最も広く使われているツールです。

**Docker とは？**

[Docker](https://www.docker.com/) は、コンテナをビルドし実行するためのプラットフォームです。`Dockerfile` にアプリケーション環境のセットアップ方法を記述すると、Docker がそれをどこでも実行できるイメージにビルドします。本ワークショップでは、各サービスが `Dockerfiles.d/` 配下に独自の Dockerfile を持っています。

**Docker Compose とは？**

[Docker Compose](https://docs.docker.com/compose/) は、マルチコンテナアプリケーションを定義・実行するためのツールです。すべてのサービス（Web サーバー、データベース、テストランナーなど）を 1 つの `compose.yaml` ファイルに記述し、`docker compose up` の一つのコマンドですべてを起動できます。本ワークショップでは、すべてのステップで Docker Compose を使用して開発環境を実行します。

</details>

<details>
<summary><strong>Tips：便利な Docker Compose コマンド（クリックで展開）</strong></summary>

**サービスの起動**

```bash
docker compose up          # すべてのサービスを起動（フォアグラウンド、ログ表示）
docker compose up -d       # すべてのサービスをバックグラウンドで起動（デタッチモード）
```

**サービスの停止**

```bash
docker compose down                  # コンテナの停止と削除
docker compose down --remove-orphans # compose.yaml に存在しないサービスのコンテナも削除
docker compose down -v               # ボリューム（データベースデータなど）も削除
```

> `--remove-orphans` は、ステップ間を移動する際に特に便利です。各ステップで使用するサービスが異なるため、このオプションがないと前のステップのコンテナが動き続ける場合があります。

> `-v` はデータベースデータなどの名前付きボリュームを削除します。クリーンな状態にしたいときに使いますが、**保存されたデータがすべて削除される**点に注意してください。

**実行中のコンテナの確認**

```bash
docker compose ps   # 現在の Compose プロジェクトのコンテナを表示
docker ps           # システム上のすべての実行中コンテナを表示
```

**ポートの競合**

`port is already allocated` や `address already in use` というエラーが出た場合、前のステップのコンテナ（または別のアプリケーション）がそのポートを使用しています。以下の方法で解決できます：

1. ポートの使用状況を確認：`docker ps` または `lsof -i :3000`
2. 前のステップのコンテナを停止：`docker compose down --remove-orphans`
3. Docker 以外のプロセスがポートを使用している場合、そのプロセスを先に停止

</details>

## 完了後の期待される出力

プロンプトを完了すると、step-1 と同等のプロジェクトが構築されます：

- `docker compose up` で Next.js 開発サーバーが起動
- **http://localhost:3000** — デフォルトの Next.js「Create Next App」ランディングページ
- `docker compose --profile=e2e-tests run --rm web-e2e-tests` — Playwright E2E テストがパス

**次のステップに進む前のクリーンアップ：**

```bash
docker compose down --remove-orphans
```

---

[次へ: step-1 — 空の Next.js アプリ](../step-1/README.ja.md)
