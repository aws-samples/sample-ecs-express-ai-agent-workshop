# Secrets Management

AWS Secrets Manager stores the 10 backend secrets. The persistent Terraform layer creates the secret containers (empty); the ephemeral layer automatically populates `DATABASE_URL`. The remaining 9 secrets must be populated manually or via CI **before** deploying the ephemeral layer.

## Secrets list

| # | Environment variable | Description | How to generate / obtain |
|---|----------------------|-------------|--------------------------|
| 1 | `DATABASE_URL` | PostgreSQL connection string | **Auto-managed by Terraform** (ephemeral layer) |
| 2 | `AUTH_JWT_SECRET` | JWT access token signing secret | `openssl rand -base64 32` |
| 3 | `AUTH_JWT_REFRESH_SECRET` | JWT refresh token signing secret | `openssl rand -base64 32` (must differ from `AUTH_JWT_SECRET`) |
| 4 | `AUTH_SESSION_SECRET` | Express session secret (required for X/Twitter OAuth2 PKCE) | `openssl rand -base64 32` |
| 5 | `AUTH_APPLE_PRIVATE_KEY` | Apple Sign-in private key (`.p8` file contents, `\n`-escaped) | [Apple Developer](https://developer.apple.com/) > Certificates, Identifiers & Profiles > Keys |
| 6 | `AUTH_DISCORD_CLIENT_SECRET` | Discord OAuth2 client secret | [Discord Developer Portal](https://discord.com/developers/applications) > OAuth2 |
| 7 | `AUTH_GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret | [GitHub Developer Settings](https://github.com/settings/developers) > OAuth Apps |
| 8 | `AUTH_GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret | [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials |
| 9 | `AUTH_TWITTER_CLIENT_SECRET` | X (Twitter) OAuth2 client secret | [Twitter Developer Portal](https://developer.twitter.com/) > App Settings > OAuth 2.0 |
| 10 | `SMTP_PASS` | SMTP password (e.g. Amazon SES IAM SMTP credential) | AWS IAM > Create SMTP credentials |

> **Note:** `DATABASE_URL` is the only secret whose value is computed by Terraform (from the database endpoint). All others require manual input.

## AWS Secrets Manager

Defined in `iac/aws/secrets-manager.tf`. Names use the pattern `{app_unique_id}/backend/{ENV_VAR}`.

| Secret name | Terraform resource |
|---|---|
| `oauth2-app/backend/DATABASE_URL` | `aws_secretsmanager_secret.backend_database_url` |
| `oauth2-app/backend/AUTH_JWT_SECRET` | `aws_secretsmanager_secret.backend_jwt_secret` |
| `oauth2-app/backend/AUTH_JWT_REFRESH_SECRET` | `aws_secretsmanager_secret.backend_jwt_refresh_secret` |
| `oauth2-app/backend/AUTH_SESSION_SECRET` | `aws_secretsmanager_secret.backend_session_secret` |
| `oauth2-app/backend/AUTH_APPLE_PRIVATE_KEY` | `aws_secretsmanager_secret.backend_apple_private_key` |
| `oauth2-app/backend/AUTH_DISCORD_CLIENT_SECRET` | `aws_secretsmanager_secret.backend_discord_client_secret` |
| `oauth2-app/backend/AUTH_GITHUB_CLIENT_SECRET` | `aws_secretsmanager_secret.backend_gh_client_secret` |
| `oauth2-app/backend/AUTH_GOOGLE_CLIENT_SECRET` | `aws_secretsmanager_secret.backend_google_client_secret` |
| `oauth2-app/backend/AUTH_TWITTER_CLIENT_SECRET` | `aws_secretsmanager_secret.backend_twitter_client_secret` |
| `oauth2-app/backend/SMTP_PASS` | `aws_secretsmanager_secret.backend_smtp_pass` |

Populate via CLI:

```sh
aws secretsmanager put-secret-value \
  --secret-id "oauth2-app/backend/AUTH_JWT_SECRET" \
  --secret-string "$(openssl rand -base64 32)"
```

## Deployment workflow

1. **`terraform apply` (persistent layer)** — creates secret containers with no values
2. **Populate secrets** — set the 9 manually-managed secrets via CLI or AWS console (see commands above)
3. **`terraform apply` (ephemeral layer)** — creates the database, auto-populates `DATABASE_URL`, and deploys containers that read all 10 secrets at startup

## Access control

| Provider | Mechanism | Permissions |
|---|---|---|
| AWS | IAM policy on ECS execution role | `secretsmanager:GetSecretValue` for all 10 secrets |
