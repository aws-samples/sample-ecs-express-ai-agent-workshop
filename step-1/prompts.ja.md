# step-1 を step-2 に成長させるプロンプト

以下のプロンプトを順番に AI エージェントに渡して、この空の Next.js アプリを Amazon ECS Express Mode にデプロイ可能なプロジェクトに進化させます。

## 1. Web アプリの本番用 Dockerfile を追加

`Dockerfiles.d/web-build/Dockerfile` に、Next.js アプリをスタンドアロン出力としてビルドし `node server.js` で実行する本番用 Dockerfile を作成してください。`node:24-bookworm-slim` を使用したマルチステージビルドで、`GIT_SHA` ビルド引数を受け入れ、最小限の最終イメージを生成してください。

## 2. AWS 永続インフラの Terraform IaC を追加

`iac/aws/` 配下に永続 AWS インフラの Terraform 設定を作成してください。以下を含めてください：
- 2 つの AZ にまたがる 2 つのパブリックサブネット、インターネットゲートウェイ、ルートテーブルを持つ VPC
- ECS Web タスク用のセキュリティグループ（ポート 3000）
- Web イメージ用の ECR リポジトリ
- ECS タスク実行と ECS Express インフラ用の IAM ロール
- Terraform state 用の S3 バックエンド（init 時に `-backend-config` で設定）
- `app_unique_id` と `aws_region` を含む `terraform.tfvars.example`
- Docker Compose 経由で Terraform を実行するための `Dockerfiles.d/iac/Dockerfile`（`hashicorp/terraform` ベース）

## 3. AWS エフェメラルインフラの Terraform IaC を追加

`iac/aws/ephemeral/` 配下にエフェメラル AWS インフラの Terraform 設定を作成してください。以下を含めてください：
- `terraform_remote_state` で永続レイヤーの出力を読み取る `remote-state.tf`
- 永続レイヤーの ECR イメージを使用する Web アプリ用 ECS Express Gateway サービス（ポート 3000、256 CPU、512 MiB メモリ、1-2 タスクのオートスケーリング）
- `app_unique_id`、`aws_region`、`aws_tf_state_bucket`、`aws_tf_state_region`、`image_tag`、`frontend_url` の変数
- Web サービス URL の出力
- `terraform.tfvars.example`

## 4. compose.yaml に IaC サービスを追加

`compose.yaml` に `iac` サービスを追加してください。`Dockerfiles.d/iac/Dockerfile` を使用し、`~/.aws` を読み取り専用でマウントし、`.env` から AWS と Terraform の環境変数を渡し、`iac` プロファイルで動作するようにしてください。

## 5. .env に AWS 環境変数を追加

`.env` と `.example.env` に AWS と Terraform の変数を追加してください。`AWS_PROFILE`、`AWS_IAM_ROLE_ARN`、`AWS_TF_STATE_BUCKET`、`AWS_TF_STATE_REGION`、`AWS_REGION`、`APP_UNIQUE_ID`、`FRONTEND_URL`、`IMAGE_TAG` を含めてください。

## 6. Web E2E テスト用の GitHub Actions ワークフローを追加

`.github/workflows/web.e2e-tests.yaml` に、main への push/PR 時に web や Dockerfiles の変更があった場合に `docker compose --profile e2e-tests` で Playwright E2E テストを実行する GitHub Actions ワークフローを作成してください。

## 7. Web イメージビルド・プッシュ用の GitHub Actions ワークフローを追加

`.github/workflows/_reusable-web-build.yaml` に、Web Docker イメージをビルドして GHCR にプッシュし、オプションで AWS ECR にもプッシュする再利用可能な GitHub Actions ワークフローを作成してください（AWS 認証に OIDC、ECR リポジトリ URL に Terraform 出力を使用）。`.github/workflows/web.build.yaml` に、Staging と Production 環境用の呼び出しワークフローを作成してください。

## 8. IaC（Terraform）用の GitHub Actions ワークフローを追加

Terraform 用の GitHub Actions ワークフローを作成してください：
- `.github/workflows/_reusable-iac.yaml` — 永続レイヤーの plan/apply 用再利用可能ワークフロー（AWS のみ）
- `.github/workflows/iac.yaml` — 永続レイヤーの呼び出しワークフロー、main への push/PR 時に `iac/aws/*` の変更でトリガー
- `.github/workflows/iac.ephemeral.yaml` — エフェメラルレイヤーの手動ディスパッチワークフロー（plan/apply/destroy）
- `.github/actions/bootstrap-tfstate-s3/action.yaml` — S3 state バケットが存在しない場合に作成するコンポジットアクション

## 9. OIDC セットアップドキュメントを追加

`docs/oidc-setup.md` に、GitHub Actions 用の AWS IAM OIDC プロバイダーと IAM ロールのセットアップ方法を文書化してください。

## 10. クラウドデプロイドキュメントを追加

Amazon ECS Express Mode へのデプロイに関するドキュメントを作成してください：
- `docs/cloud-deployment.md` — デプロイアーキテクチャの概要（永続 + エフェメラルレイヤー）
- `docs/cloud-deployment-aws.md` — AWS デプロイのステップバイステップガイド（state バケット作成、tfvars 設定、永続レイヤー apply、イメージ push、エフェメラルレイヤー apply）
- `docs/ci.md` — CI/CD ワークフロー概要、必要な GitHub Actions 変数とシークレット

## 11. Git SHA 表示ドキュメントを追加

`docs/git-sha-display.md` に、ビルド時に Web アプリに Git SHA がどのように注入されるかを文書化してください。
