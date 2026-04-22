# Auto-populate DATABASE_URL secret from the RDS endpoint.

resource "aws_secretsmanager_secret_version" "backend_database_url" {
  secret_id     = local.persistent.secret_database_url_arn
  secret_string = local.database_url
}
