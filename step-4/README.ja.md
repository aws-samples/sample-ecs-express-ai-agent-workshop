# Step 4 — ECS Express Mode 上の Next.js + NestJS（Items CRUD）

Next.js フロントエンドと、ヘルスチェック（Git SHA）および Items CRUD（PostgreSQL + Prisma）を備えた NestJS バックエンドを、AWS ECS Express Mode にデプロイします。

## サービス

| サービス | 技術 | ポート |
|---------|------|--------|
| backend | NestJS 11 + PostgreSQL 17 + Prisma | 4000 |
| web | Next.js 16 | 3000 |

## 開始時のアーキテクチャ

以下の図は、このステップを**開始した時点で既にあるもの**を示しています — 最終目標ではありません。完了後に何が構築されるかは[完了後の期待される出力](#完了後の期待される出力)を参照してください。

```mermaid
graph TB
    subgraph Local ["ローカル開発"]
        direction LR
        Web["Web<br/>Next.js :3000"]
        Backend["Backend<br/>NestJS :4000"]
        DB_Local["PostgreSQL :5432"]
        E2E["E2E Tests<br/>Playwright"]
        Web -->|API| Backend
        Backend --> DB_Local
        E2E -.->|テスト| Web
    end

    subgraph AWS ["AWS クラウド"]
        subgraph Persistent ["永続レイヤー"]
            VPC["VPC"]
            ECR["ECR"]
            IAM["IAM ロール"]
            SG["セキュリティグループ"]
            SM["Secrets Manager<br/>DATABASE_URL"]
        end
        subgraph Ephemeral ["エフェメラルレイヤー"]
            ECS_Web["ECS Express<br/>Web :3000"]
            ECS_Backend["ECS Express<br/>Backend :4000"]
            RDS["RDS<br/>PostgreSQL"]
            NAT["NAT Gateway"]
        end
    end

    ECS_Web -->|API| ECS_Backend
    ECS_Backend --> RDS
    SM -.->|注入| ECS_Backend
```

## 前提条件

- Docker Engine + Docker Compose（例: [Docker Desktop](https://www.docker.com/products/docker-desktop/)、[Podman](https://podman.io/)、[Colima](https://github.com/abiosoft/colima)）
- GitHub リポジトリ（オプション — `.github/` の GitHub Actions CI/CD ワークフローを使用する場合のみ必要）

## クイックスタート

```sh
cp .example.secrets.env .secrets.env
docker compose up
```

| URL | 説明 |
|-----|------|
| http://localhost:4000/health | バックエンドヘルスチェック |
| http://localhost:4000/api | Swagger UI |
| http://localhost:3000 | Web |

## E2E テストの実行

```sh
docker compose --profile=e2e-tests run --rm web-e2e-tests
```

## プロジェクト構成

```
.
├── compose.yaml
├── backend/               # NestJS API（ヘルスチェック + Items CRUD）
│   └── prisma/            # Prisma スキーマ（Item モデル）
├── web/
│   ├── app/               # Next.js App Router
│   └── e2e-tests/         # Playwright E2E テスト
├── iac/                   # Terraform IaC（AWS）
├── Dockerfiles.d/
├── .github/               # GitHub Actions ワークフロー + カスタムアクション
└── docs/
```

## クラウドデプロイ（Terraform）

詳細は [docs/cloud-deployment-aws.md](docs/cloud-deployment-aws.md) を参照してください。概要：

```sh
# 1. 変数の設定
cp iac/aws/terraform.tfvars.example iac/aws/terraform.tfvars
cp iac/aws/ephemeral/terraform.tfvars.example iac/aws/ephemeral/terraform.tfvars

# 2. 永続インフラのデプロイ（VPC、ECR、IAM、Secrets Manager）
source .env
docker compose --profile=iac run --rm iac terraform -chdir=aws init \
  -backend-config="bucket=$AWS_TF_STATE_BUCKET" \
  -backend-config="region=$AWS_TF_STATE_REGION"
docker compose --profile=iac run --rm iac terraform -chdir=aws apply -var-file=terraform.tfvars

# 3. Docker イメージをビルドして ECR にプッシュ後、エフェメラルインフラをデプロイ（ECS Express Gateway、RDS）
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral init \
  -backend-config="bucket=$AWS_TF_STATE_BUCKET" \
  -backend-config="region=$AWS_TF_STATE_REGION"
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral apply -var-file=terraform.tfvars
```

### イメージのビルドとプッシュ

永続レイヤーのデプロイ後、エフェメラルレイヤーのデプロイ前に本番イメージをビルドしてプッシュします：

```sh
# Docker を ECR に認証
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Backend をビルドしてプッシュ
docker build -f Dockerfiles.d/backend-build/Dockerfile \
  -t $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-backend:latest \
  backend
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-backend:latest

# Web をビルドしてプッシュ
docker build -f Dockerfiles.d/web-build/Dockerfile \
  -t $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-web:latest \
  web/app
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-web:latest
```

### シークレット

このステップでは、唯一のシークレットである `DATABASE_URL` はエフェメラルレイヤーの Terraform が RDS エンドポイントから**自動的に設定**します。手動でのシークレット設定は不要です。

## AI エージェントによる実装

次のステップ（step-5）に進むために、AI エージェント（[Claude Code](https://claude.ai/claude-code)、[Cursor](https://www.cursor.com/)、[GitHub Copilot](https://github.com/features/copilot)、[ChatGPT](https://chatgpt.com/) など）にコードを生成させることができます。

このディレクトリの [prompts.ja.md](prompts.ja.md) の内容をコピーして AI エージェントに渡してください。正しく実行されれば、手動の作業なしで step-5 と同等の環境が構築されます。

<details>
<summary><strong>用語解説：JWT（クリックで展開）</strong></summary>

**JWT とは？**

JWT（JSON Web Token）は、認証に使用されるコンパクトで URL セーフなトークン形式です。ユーザーがサインインすると、サーバーはユーザーの識別情報（ユーザー ID やメールなど）を含む署名付きトークンを作成します。クライアントはこのトークンを保存し、各リクエストの `Authorization: Bearer <token>` ヘッダーに含めて送信します。サーバーはデータベースでセッションを検索することなく署名を検証できるため、ステートレスでスケーラブルです。本ワークショップでは、**アクセストークン**（短期間有効、API リクエスト用）と**リフレッシュトークン**（長期間有効、新しいアクセストークンの取得用）の 2 つの JWT を使用します。

</details>

## 完了後の期待される出力

プロンプトを完了すると、step-5 と同等のプロジェクトが構築されます：

- **http://localhost:3000** — 未認証は `/signin`、認証済みは `/dashboard` にリダイレクト
- **http://localhost:3000/signup** — 登録フォーム（メール + パスワード、8 文字以上）
- **http://localhost:3000/signin** — メール/パスワードのサインインフォーム
- **http://localhost:3000/dashboard** — ユーザープロフィール表示（ID、メール、登録日）
- **http://localhost:3000/items** — ユーザースコープのアイテム（認証必須）
- **http://localhost:4000/api** — Swagger UI（Auth + Items エンドポイント）
- アイテムは認証ユーザーにスコープ（削除時に所有権チェック）
- E2E テストでサインアップフローと認証済みアイテム管理を検証

---

[前へ: step-3 — Next.js + NestJS（ヘルスチェック）](../step-3/README.ja.md) | [次へ: step-5 — Next.js + NestJS（認証 + Items CRUD）](../step-5/README.ja.md)
