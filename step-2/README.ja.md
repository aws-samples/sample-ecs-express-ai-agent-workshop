# Step 2 — ECS Express Mode 上の Next.js

Amazon ECS Express Mode へデプロイするための IaC（Terraform）と GitHub Actions による CI/CD を備えた Next.js アプリです。

## サービス

| サービス | 技術 | ポート |
|---------|------|--------|
| web | Next.js 16 | 3000 |

## 開始時のアーキテクチャ

以下の図は、このステップを**開始した時点で既にあるもの**を示しています — 最終目標ではありません。完了後に何が構築されるかは[完了後の期待される出力](#完了後の期待される出力)を参照してください。

```mermaid
graph TB
    subgraph Local ["ローカル開発"]
        direction LR
        Web["Web<br/>Next.js :3000"]
        E2E["E2E Tests<br/>Playwright"]
        E2E -.->|テスト| Web
    end

    subgraph AWS ["AWS クラウド"]
        subgraph Persistent ["永続レイヤー"]
            VPC["VPC"]
            ECR["ECR"]
            IAM["IAM ロール"]
            SG["セキュリティグループ"]
        end
        subgraph Ephemeral ["エフェメラルレイヤー"]
            ECS_Web["ECS Express<br/>Web :3000"]
        end
    end

    subgraph CI ["GitHub Actions"]
        GHA["CI/CD ワークフロー"]
    end

    GHA -->|イメージ push| ECR
    GHA -->|デプロイ| ECS_Web
    ECR -->|イメージ pull| ECS_Web
```

## プロジェクト構成

```
.
├── compose.yaml
├── web/
│   ├── app/               # Next.js App Router
│   └── e2e-tests/         # Playwright E2E テスト
├── iac/                   # Terraform IaC（AWS）
├── Dockerfiles.d/
├── .github/               # GitHub Actions ワークフロー + カスタムアクション
└── docs/
```

## 前提条件

- Docker Engine + Docker Compose（例: [Docker Desktop](https://www.docker.com/products/docker-desktop/)、[Podman](https://podman.io/)、[Colima](https://github.com/abiosoft/colima)）
- 管理者権限を持つ AWS アカウント（オプション — クラウドにデプロイする場合のみ必要）
- GitHub リポジトリ（オプション — `.github/` の GitHub Actions CI/CD ワークフローを使用する場合のみ必要）

## このステップを実行する

```sh
cp .example.env .env   # 必要に応じて編集 — ファイル内のコメントを参照
docker compose up
```

http://localhost:3000 を開くとアプリが表示されます。

## E2E テストの実行

```sh
docker compose --profile=e2e-tests run --rm web-e2e-tests
```

## クラウドデプロイ（Terraform）

ECS ワークショップですので、フル体験のために **AWS へのデプロイを推奨します**。Terraform コマンドはすべて `docker compose` 経由で実行するため、ホストに Terraform をインストールする必要はありません。AWS アカウントをまだお持ちでない場合は、ローカル開発で先に進めて後からデプロイすることもできます。

> **コストに関する注意:** ECS および関連リソースは稼働中に時間単位で課金されます。作業が終わったら、予期しないコストを避けるためにエフェメラルレイヤーを破棄してください：
> ```sh
> docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral destroy -var-file=terraform.tfvars
> ```
> `terraform apply` でいつでも再作成できます。コスト見積もりはトップレベルの [README](../README.ja.md#所要時間--コスト見積もり) を参照してください。

詳細は [docs/cloud-deployment-aws.md](docs/cloud-deployment-aws.md) を参照してください。GitHub Actions で CI/CD を行うには、[OIDC 認証](docs/oidc-setup.md)の設定と [GitHub Actions の変数とシークレット](docs/ci.md)の設定が必要です。概要：

```sh
# 1. 変数の設定
cp iac/aws/terraform.tfvars.example iac/aws/terraform.tfvars
cp iac/aws/ephemeral/terraform.tfvars.example iac/aws/ephemeral/terraform.tfvars
# terraform.tfvars を編集し、app_unique_id を設定（例: "my-workshop"）
# APP_UNIQUE_ID は AWS リソース名（ECR リポジトリ、Secrets Manager キーなど）の一意なプレフィックスです

# 2. 永続インフラのデプロイ（VPC、ECR、IAM）
source .env
docker compose --profile=iac run --rm iac terraform -chdir=aws init \
  -backend-config="bucket=$AWS_TF_STATE_BUCKET" \
  -backend-config="region=$AWS_TF_STATE_REGION"
docker compose --profile=iac run --rm iac terraform -chdir=aws apply -var-file=terraform.tfvars

# 3. Docker イメージをビルドして ECR にプッシュ
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker build -f Dockerfiles.d/web-build/Dockerfile \
  -t $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-web:latest \
  web/app
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-web:latest

# 4. エフェメラルインフラをデプロイ（ECS Express Gateway）
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral init \
  -backend-config="bucket=$AWS_TF_STATE_BUCKET" \
  -backend-config="region=$AWS_TF_STATE_REGION"
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral apply -var-file=terraform.tfvars
```

> ECR リポジトリの URL は永続レイヤーの Terraform 出力から確認できます。詳細は [docs/cloud-deployment-aws.md](docs/cloud-deployment-aws.md) を参照してください。

<details>
<summary><strong>Tips: Docker Compose 経由の Terraform コマンド（クリックで展開）</strong></summary>

本ワークショップの Terraform コマンドはすべて `docker compose --profile=iac run --rm iac terraform ...` で Docker コンテナ内で実行します。

**現在の状態を確認する**

```bash
# 永続レイヤーのデプロイ済みリソースを表示
docker compose --profile=iac run --rm iac terraform -chdir=aws show

# エフェメラルレイヤーのデプロイ済みリソースを表示
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral show
```

**出力を確認する（URL、リソース ID など）**

```bash
# 永続レイヤーのすべての出力を表示
docker compose --profile=iac run --rm iac terraform -chdir=aws output

# エフェメラルレイヤーのすべての出力を表示
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral output

# 特定の出力値を表示
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral output web_url
```

**適用前に変更をプレビューする**

```bash
# 実際に実行せずに Terraform が何を作成/変更/破棄するか確認
docker compose --profile=iac run --rm iac terraform -chdir=aws plan -var-file=terraform.tfvars
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral plan -var-file=terraform.tfvars
```

**リソースを破棄する**

```bash
# エフェメラルレイヤーのみ破棄（ECS など）— いつでも再作成可能
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral destroy -var-file=terraform.tfvars

# 永続レイヤーを破棄（VPC、ECR、IAM）— 完全に終了する場合のみ
docker compose --profile=iac run --rm iac terraform -chdir=aws destroy -var-file=terraform.tfvars
```

> 破棄する際は必ず**エフェメラルレイヤーを先に**、次に永続レイヤーの順で実行してください。エフェメラルレイヤーは永続レイヤーのリソースに依存しています。

</details>

## AI エージェントによる実装

次のステップ（step-3）に進むために、AI エージェント（[Claude Code](https://claude.ai/claude-code)、[Cursor](https://www.cursor.com/)、[GitHub Copilot](https://github.com/features/copilot)、[ChatGPT](https://chatgpt.com/) など）にコードを生成させることができます。

このディレクトリの [prompts.ja.md](prompts.ja.md) の内容をコピーして AI エージェントに渡してください。正しく実行されれば、手動の作業なしで step-3 と同等の環境が構築されます。

<details>
<summary><strong>用語解説：NestJS（クリックで展開）</strong></summary>

**NestJS とは？**

[NestJS](https://nestjs.com/) は、サーバーサイドアプリケーションを構築するための TypeScript ベースのバックエンドフレームワークです。Angular に触発された高度に構造化されたモジュラーアーキテクチャ（デコレーター、依存性注入、モジュール）を使用しており、AI エージェントがコードを生成・拡張する際に非常に予測しやすくなっています。本ワークショップでは、次のステップから NestJS をバックエンド API として使用します。

</details>

## 完了後の期待される出力

プロンプトを完了すると、step-3 と同等のプロジェクトが構築されます：

- ヘルスチェックエンドポイントを持つ NestJS バックエンド
- **http://localhost:4000/health** のレスポンス：
  ```json
  { "status": "ok", "gitSha": "abc1234" }
  ```
  > **注意：** ワークショップリポジトリのサブディレクトリ（例：`step-3/`）としてこのステップを実行している場合、`.git/` が親ディレクトリにあるため `gitSha` は `"undefined"` と表示されます。これは正常です。プロジェクトが独自の Git リポジトリのルートにある場合は、実際のコミットハッシュが表示されます。
- **http://localhost:4000/api** — Swagger UI（非本番環境）
- **http://localhost:3000** — **「ECS Express Workshop」** タイトルとバックエンドの Git SHA を表示する Web ページ
- E2E テストで Git SHA の表示を検証

AWS にデプロイした場合は、Amazon ECS からも同じ Web ページにアクセスできます。以下のコマンドで URL を取得してください：

```sh
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral output web_url
```

出力された URL をブラウザで開いて動作を確認してください。

**次のステップに進む前のクリーンアップ：**

```bash
docker compose down --remove-orphans
```

<details>
<summary><strong>ワークショップから離れますか？クラウドインフラも破棄してください（クリックで展開）</strong></summary>

AWS にデプロイした場合は、継続的な課金を避けるためにクラウドリソースを破棄してください：

```sh
# 1. エフェメラルレイヤーを破棄（ECS など）
source .env
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral destroy -var-file=terraform.tfvars

# 2. 永続レイヤーを破棄（VPC、ECR、IAM）
docker compose --profile=iac run --rm iac terraform -chdir=aws destroy -var-file=terraform.tfvars
```

</details>

---

[前へ: step-1 — 空の Next.js アプリ](../step-1/README.ja.md) | [次へ: step-3 — Next.js + NestJS（ヘルスチェック）](../step-3/README.ja.md)
