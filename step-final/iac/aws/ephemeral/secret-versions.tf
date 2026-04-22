# -----------------------------------------------------------------------------
# Secrets Manager — DATABASE_URL depends on the RDS endpoint so it must be
# managed here. All other secrets are populated externally (CI or manual).
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret_version" "backend_database_url" {
  secret_id     = local.persistent.secret_database_url_arn
  secret_string = local.database_url
}
