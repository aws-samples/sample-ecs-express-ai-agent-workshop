# -----------------------------------------------------------------------------
# Secrets Manager — backend sensitive environment variables
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "backend_database_url" {
  name                    = "${var.app_unique_id}/backend/DATABASE_URL"
  description             = "PostgreSQL connection string for the backend"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "backend_jwt_secret" {
  name                    = "${var.app_unique_id}/backend/AUTH_JWT_SECRET"
  description             = "JWT access token signing secret"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "backend_jwt_refresh_secret" {
  name                    = "${var.app_unique_id}/backend/AUTH_JWT_REFRESH_SECRET"
  description             = "JWT refresh token signing secret"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "backend_session_secret" {
  name                    = "${var.app_unique_id}/backend/AUTH_SESSION_SECRET"
  description             = "Express session secret"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "backend_apple_private_key" {
  name                    = "${var.app_unique_id}/backend/AUTH_APPLE_PRIVATE_KEY"
  description             = "Apple Sign-in private key (.p8)"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "backend_discord_client_secret" {
  name                    = "${var.app_unique_id}/backend/AUTH_DISCORD_CLIENT_SECRET"
  description             = "Discord OAuth2 client secret"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "backend_gh_client_secret" {
  name                    = "${var.app_unique_id}/backend/AUTH_GITHUB_CLIENT_SECRET"
  description             = "GitHub OAuth App client secret"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "backend_google_client_secret" {
  name                    = "${var.app_unique_id}/backend/AUTH_GOOGLE_CLIENT_SECRET"
  description             = "Google OAuth2 client secret"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "backend_twitter_client_secret" {
  name                    = "${var.app_unique_id}/backend/AUTH_TWITTER_CLIENT_SECRET"
  description             = "X (Twitter) OAuth2 client secret"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "backend_smtp_pass" {
  name                    = "${var.app_unique_id}/backend/SMTP_PASS"
  description             = "SMTP password (e.g. Amazon SES IAM SMTP credential)"
  recovery_window_in_days = 0
}

# -----------------------------------------------------------------------------
# IAM — grant ECS execution role permission to read these secrets
# -----------------------------------------------------------------------------

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "${var.app_unique_id}-ecs-execution-secrets"
  role = aws_iam_role.ecs_execution.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "secretsmanager:GetSecretValue"
        Resource = [
          aws_secretsmanager_secret.backend_database_url.arn,
          aws_secretsmanager_secret.backend_jwt_secret.arn,
          aws_secretsmanager_secret.backend_jwt_refresh_secret.arn,
          aws_secretsmanager_secret.backend_session_secret.arn,
          aws_secretsmanager_secret.backend_apple_private_key.arn,
          aws_secretsmanager_secret.backend_discord_client_secret.arn,
          aws_secretsmanager_secret.backend_gh_client_secret.arn,
          aws_secretsmanager_secret.backend_google_client_secret.arn,
          aws_secretsmanager_secret.backend_twitter_client_secret.arn,
          aws_secretsmanager_secret.backend_smtp_pass.arn,
        ]
      },
    ]
  })
}
