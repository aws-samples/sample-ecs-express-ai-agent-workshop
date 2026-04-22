# -----------------------------------------------------------------------------
# Secrets Manager — backend sensitive environment variables
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "backend_database_url" {
  name                    = "${var.app_unique_id}/backend/DATABASE_URL"
  description             = "PostgreSQL connection string for the backend"
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
        ]
      },
    ]
  })
}
