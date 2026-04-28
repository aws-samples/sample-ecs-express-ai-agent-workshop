# Step 5 — ECS Express Mode 上の Next.js + NestJS（認証 + Items CRUD）

Next.js フロントエンドと、メール/パスワード認証（JWT）およびユーザースコープの Items CRUD（PostgreSQL + Prisma）を備えた NestJS バックエンドを、Amazon ECS Express Mode にデプロイします。

## サービス

| サービス | 技術 | ポート |
|---------|------|--------|
| backend | NestJS 11 + PostgreSQL 17 + Prisma + JWT Auth | 4000 |
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
        Web -->|Auth + API| Backend
        Backend --> DB_Local
        E2E -.->|テスト| Web
    end

    subgraph AWS ["AWS クラウド"]
        subgraph Persistent ["永続レイヤー"]
            VPC["VPC"]
            ECR["ECR"]
            IAM["IAM ロール"]
            SG["セキュリティグループ"]
            SM["Secrets Manager<br/>JWT + DATABASE_URL"]
        end
        subgraph Ephemeral ["エフェメラルレイヤー"]
            ECS_Web["ECS Express<br/>Web :3000"]
            ECS_Backend["ECS Express<br/>Backend :4000"]
            RDS["RDS<br/>PostgreSQL"]
            NAT["NAT Gateway"]
        end
    end

    User["ユーザー"] -->|サインアップ / サインイン| ECS_Web
    ECS_Web -->|JWT Auth + API| ECS_Backend
    ECS_Backend --> RDS
    SM -.->|注入| ECS_Backend
```

## プロジェクト構成

```
.
├── compose.yaml
├── backend/               # NestJS API（認証 + アイテム）
│   └── prisma/            # Prisma スキーマ（User + Item モデル）
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
cp .example.env .env               # 必要に応じて編集 — ファイル内のコメントを参照
cp .example.secrets.env .secrets.env
docker compose up
```

> **セキュリティに関する注意:** 本ワークショップでは学習しやすさのためにシークレットを `.secrets.env` ファイルに配置しています。本番環境ではローカルファイルではなくシークレットマネージャー（例：AWS Secrets Manager）を使用してください。AI コーディングエージェントは作業ディレクトリ内のファイルを読み取れるため、`.secrets.env` に本番用の認証情報を絶対に入れないでください。サンプルのデフォルト値はローカル開発用で安全です。`.secrets.env` は `.gitignore` の `*.env` により Git から除外されています。

> **ヒント:** OAuth2 プロバイダー（Apple、Discord、GitHub、Google、X）の設定は、このステップを試すだけなら不要です。`.example.secrets.env` のデフォルトのダミー値のままでアプリは動作します。OAuth2 サインインボタンは機能しませんが、メール/パスワードでのサインアップとサインインは OAuth2 の設定なしで利用できます。

| URL | 説明 |
|-----|------|
| http://localhost:4000/health | バックエンドヘルスチェック |
| http://localhost:4000/api | Swagger UI |
| http://localhost:3000 | Web |

## バックエンド API

- `POST /auth/signup` — メール/パスワードで登録（JWT トークンを返す）
- `POST /auth/signin` — メール/パスワードでサインイン
- `POST /auth/refresh` — アクセストークンのリフレッシュ
- `GET /auth/me` — 現在のユーザーを取得（JWT 必須）
- `DELETE /auth/account` — アカウント削除（JWT 必須）
- `POST /items` — アイテム作成（JWT 必須）
- `GET /items` — ユーザーのアイテム一覧（JWT 必須）
- `DELETE /items/:id` — アイテム削除（JWT 必須、所有権チェック）

## クラウドデプロイ（Terraform）

ECS ワークショップですので、フル体験のために **AWS へのデプロイを推奨します**。Terraform コマンドはすべて `docker compose` 経由で実行するため、ホストに Terraform をインストールする必要はありません。AWS アカウントをまだお持ちでない場合は、ローカル開発で先に進めて後からデプロイすることもできます。

> **コストに関する注意:** ECS および関連リソースは稼働中に時間単位で課金されます。作業が終わったら、予期しないコストを避けるためにエフェメラルレイヤーを破棄してください：
> ```sh
> docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral destroy -var-file=terraform.tfvars
> ```
> `terraform apply` でいつでも再作成できます。コスト見積もりはトップレベルの [README](../README.ja.md#所要時間--コスト見積もり) を参照してください。

詳細は [docs/cloud-deployment-aws.md](docs/cloud-deployment-aws.md) を参照してください。概要：

```sh
# 1. 変数の設定
cp iac/aws/terraform.tfvars.example iac/aws/terraform.tfvars
cp iac/aws/ephemeral/terraform.tfvars.example iac/aws/ephemeral/terraform.tfvars
# terraform.tfvars を編集し、app_unique_id を設定（例: "my-workshop"）
# APP_UNIQUE_ID は AWS リソース名（ECR リポジトリ、Secrets Manager キーなど）の一意なプレフィックスです

# 2. 永続インフラのデプロイ（VPC、ECR、IAM、Secrets Manager）
source .env
docker compose --profile=iac run --rm iac terraform -chdir=aws init \
  -backend-config="bucket=$AWS_TF_STATE_BUCKET" \
  -backend-config="region=$AWS_TF_STATE_REGION"
docker compose --profile=iac run --rm iac terraform -chdir=aws apply -var-file=terraform.tfvars

# 3. Docker イメージをビルドして ECR にプッシュ
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker build -f Dockerfiles.d/backend-build/Dockerfile \
  -t $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-backend:latest \
  backend
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-backend:latest
docker build -f Dockerfiles.d/web-build/Dockerfile \
  -t $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-web:latest \
  web/app
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-web:latest

# 4. エフェメラルインフラをデプロイ（ECS Express Gateway、RDS）
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral init \
  -backend-config="bucket=$AWS_TF_STATE_BUCKET" \
  -backend-config="region=$AWS_TF_STATE_REGION"
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral apply -var-file=terraform.tfvars
```

### シークレットの設定

永続レイヤーのデプロイ後、Terraform は AWS Secrets Manager にシークレットコンテナを作成します。`DATABASE_URL` はエフェメラルレイヤーが自動的に設定しますが、JWT シークレットは手動で設定する必要があります：

```sh
aws secretsmanager put-secret-value \
  --secret-id "${APP_UNIQUE_ID}/backend/AUTH_JWT_SECRET" \
  --secret-string "$(openssl rand -base64 32)"
aws secretsmanager put-secret-value \
  --secret-id "${APP_UNIQUE_ID}/backend/AUTH_JWT_REFRESH_SECRET" \
  --secret-string "$(openssl rand -base64 32)"
```

> `APP_UNIQUE_ID` は `terraform.tfvars` の `app_unique_id` の値です。

## AI エージェントによる実装

次のステップ（step-final）に進むために、AI エージェント（[Claude Code](https://claude.ai/claude-code)、[Cursor](https://www.cursor.com/)、[GitHub Copilot](https://github.com/features/copilot)、[ChatGPT](https://chatgpt.com/) など）にコードを生成させることができます。

このディレクトリの [prompts.ja.md](prompts.ja.md) の内容をコピーして AI エージェントに渡してください。正しく実行されれば、手動の作業なしで step-final と同等の環境が構築されます。

> **注意：** プロンプトによりメール送信機能が追加されます。ローカル開発では Mailpit がモック SMTP サーバーとして使用されます（設定不要）。実際の SMTP サービスは**オプション**です — 本ワークショップではデフォルトで `AUTH_REQUIRE_EMAIL_VERIFICATION=false` が設定されており、メール認証はバイパスされます。クラウドデプロイでメール認証を有効にしたい場合は、[Amazon SES](https://aws.amazon.com/ses/)、[SendGrid](https://sendgrid.com/)、[Mailgun](https://www.mailgun.com/) などのサービスを利用できます。

<details>
<summary><strong>用語解説：OAuth2、MFA / TOTP（クリックで展開）</strong></summary>

**OAuth2 とは？**

OAuth2 は、ユーザーが新しいパスワードを作成する代わりに、他のサービス（Google、GitHub、Apple など）の既存アカウントを使ってアプリケーションにサインインできる認可プロトコルです。ユーザーが「Google でサインイン」をクリックすると、認証のために Google にリダイレクトされ、本人確認を証明するトークンと共にアプリに戻されます。アプリがユーザーのパスワードを扱わないため、ユーザーにとってより便利で安全です。

**MFA / TOTP とは？**

MFA（多要素認証）は、パスワードだけでなく第二のセキュリティレイヤーを追加します。TOTP（時間ベースのワンタイムパスワード）は最も一般的な MFA 方式の一つで、ユーザーが認証アプリ（Google Authenticator、Authy など）で QR コードをスキャンすると、30 秒ごとに変わる 6 桁のコードが生成されます。サインイン時にパスワードと現在のコードの両方を入力するため、パスワードが漏洩しても攻撃者がアクセスすることが非常に困難になります。

</details>

<details>
<summary><strong>用語解説：なぜセッションをデータベースに保存するのか？（クリックで展開）</strong></summary>

**なぜメモリやローカルファイルではダメなのか？**

インメモリセッション（例：JavaScript の単純な `Map`）はサーバーが再起動するたびに失われ、すべてのユーザーがログアウトされます。ローカルファイルベースのセッションも同じ問題を抱えています — 単一のサーバーインスタンスに紐づくためです。ECS のようなコンテナ環境では、コンテナはエフェメラル（一時的）であり、いつでも置き換え、スケール、再起動される可能性があります。

**なぜデータベース（PostgreSQL）を使うのか？**

セッションをデータベースに保存すると：

- **再起動してもセッションが保持される** — コンテナを再デプロイしてもユーザーがログアウトされない
- **複数インスタンスでセッションを共有できる** — 2 つ以上のコンテナにスケールしても、どのインスタンスでも任意のユーザーのリクエストを処理できる
- **セッションを管理できる** — データベースクエリでセッションの一覧表示、取り消し、期限切れが可能（例：「すべてのデバイスからログアウト」）

**一般的なセッションストアの選択肢：**

| ストア | メリット | デメリット |
|--------|---------|-----------|
| **PostgreSQL**（本ワークショップ） | 既に利用可能、追加インフラ不要、クエリ対応 | インメモリストアより若干遅い |
| **Redis / ElastiCache** | 読み書きが非常に高速、TTL 自動期限切れ | 追加インフラの管理が必要 |
| **DynamoDB** | サーバーレス、自動スケーリング、AWS マネージド | AWS 固有、結果整合性 |

本ワークショップでは、既にスタックに含まれている PostgreSQL（Prisma 経由）を使ってセッションを保存しています — 追加サービスは不要です。高トラフィックの本番アプリケーションでは、速度の面から Redis が人気の選択肢です。

</details>

## 完了後の期待される出力

プロンプトを完了すると、step-final と同等のプロジェクトが構築されます：

- **http://localhost:3000/signin** — サインインフォーム：
  - メール/パスワードフィールド
  - OAuth2 ボタン（Apple、Discord、GitHub、Google、X）
  - 「パスワードを忘れた場合」リンクと言語切り替え
  - TOTP MFA チャレンジ（ユーザーが有効にしている場合）
- **http://localhost:3000/signup** — メール認証フロー付き登録
- **http://localhost:3000/settings** — ユーザー設定：
  - メール管理（変更、認証、再送信）
  - パスワードリセット
  - TOTP MFA 設定/無効化（QR コードとリカバリーコード）
  - OAuth プロバイダーのリンク/リンク解除
  - テーマ切り替え（システム / ライト / ダーク）
  - アカウント削除
- **http://localhost:8025** — Mailpit UI（ローカルメールテスト）
- 国際化（英語 + 日本語）
- Auth、Items、TOTP、テーマの完全な E2E テストスイート

AWS にデプロイした場合は、Amazon ECS からも同じアプリケーションにアクセスできます。以下のコマンドで URL を取得してください：

```sh
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral output web_url
```

出力された URL をブラウザで開いて動作を確認してください。

**次のステップに進む前のクリーンアップ：**

```bash
docker compose down --remove-orphans
```

> このステップはデータベースボリュームを使用します。データベースをリセットしたい場合は、代わりに `docker compose down --remove-orphans -v` を使用してください。

<details>
<summary><strong>ワークショップから離れますか？クラウドインフラも破棄してください（クリックで展開）</strong></summary>

AWS にデプロイした場合は、継続的な課金を避けるためにクラウドリソースを破棄してください：

```sh
# 1. エフェメラルレイヤーを破棄（ECS、RDS など）
source .env
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral destroy -var-file=terraform.tfvars

# 2. 永続レイヤーを破棄（VPC、ECR、IAM、Secrets Manager）
docker compose --profile=iac run --rm iac terraform -chdir=aws destroy -var-file=terraform.tfvars
```

</details>

---

[前へ: step-4 — Next.js + NestJS（Items CRUD）](../step-4/README.ja.md) | [次へ: step-final — フルスタックアプリ](../step-final/README.ja.md)
