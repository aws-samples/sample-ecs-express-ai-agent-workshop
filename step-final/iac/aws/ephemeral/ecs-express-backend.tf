locals {
  database_url = "postgresql://${var.database_user}:${var.database_password}@${aws_db_instance.main.address}:5432/${var.database_name}"
}

resource "aws_ecs_express_gateway_service" "backend" {
  service_name            = "${var.app_unique_id}-backend"
  execution_role_arn      = local.persistent.ecs_execution_role_arn
  infrastructure_role_arn = local.persistent.ecs_infrastructure_role_arn
  cpu                     = "256"
  memory                  = "512"
  health_check_path       = "/api"

  network_configuration {
    subnets         = [local.persistent.subnet_private_a_id, local.persistent.subnet_private_b_id]
    security_groups = [local.persistent.sg_ecs_backend_id]
  }

  scaling_target {
    min_task_count              = 1
    max_task_count              = 2
    auto_scaling_metric         = "AVERAGE_CPU"
    auto_scaling_target_value   = 60
  }

  primary_container {
    image          = "${local.persistent.ecr_backend_repository_url}:${var.image_tag}"
    container_port = 4000

    environment {
      name  = "AUTH_APPLE_CLIENT_ID"
      value = var.apple_client_id
    }
    environment {
      name  = "AUTH_APPLE_KEY_ID"
      value = var.apple_key_id
    }
    environment {
      name  = "AUTH_APPLE_TEAM_ID"
      value = var.apple_team_id
    }
    # Web callback base URL uses the frontend proxy (frontend_url/backend)
    # so the session cookie stays on the same domain throughout the OAuth flow.
    environment {
      name  = "AUTH_CALLBACK_BASE_URL"
      value = "${local.frontend_url}/backend"
    }
    environment {
      name  = "AUTH_DISCORD_CLIENT_ID"
      value = var.discord_client_id
    }
    environment {
      name  = "AUTH_GITHUB_CLIENT_ID"
      value = var.gh_client_id
    }
    environment {
      name  = "AUTH_GOOGLE_CLIENT_ID"
      value = var.google_oauth_client_id
    }
    environment {
      name  = "AUTH_JWT_ACCESS_EXPIRATION"
      value = var.jwt_access_expiration
    }
    environment {
      name  = "AUTH_JWT_REFRESH_EXPIRATION"
      value = var.jwt_refresh_expiration
    }
    # Native callback base URL uses the backend directly (native apps connect to the backend).
    environment {
      name  = "AUTH_NATIVE_CALLBACK_BASE_URL"
      value = local.backend_base_url
    }
    environment {
      name  = "AUTH_TWITTER_CLIENT_ID"
      value = var.twitter_client_id
    }
    environment {
      name  = "CORS_ORIGIN"
      value = local.frontend_url
    }
    environment {
      name  = "FRONTEND_URL"
      value = local.frontend_url
    }
    environment {
      name  = "NATIVE_APP_URL_SCHEME"
      value = var.native_app_url_scheme
    }
    environment {
      name  = "PORT"
      value = "4000"
    }
    environment {
      name  = "SMTP_FROM"
      value = var.smtp_from
    }
    environment {
      name  = "SMTP_HOST"
      value = var.smtp_host
    }
    environment {
      name  = "SMTP_PORT"
      value = var.smtp_port
    }
    environment {
      name  = "SMTP_SECURE"
      value = var.smtp_secure
    }
    environment {
      name  = "SMTP_USER"
      value = var.smtp_user
    }

    secret {
      name       = "AUTH_APPLE_PRIVATE_KEY"
      value_from = local.persistent.secret_apple_private_key_arn
    }
    secret {
      name       = "AUTH_DISCORD_CLIENT_SECRET"
      value_from = local.persistent.secret_discord_client_secret_arn
    }
    secret {
      name       = "AUTH_GITHUB_CLIENT_SECRET"
      value_from = local.persistent.secret_gh_client_secret_arn
    }
    secret {
      name       = "AUTH_GOOGLE_CLIENT_SECRET"
      value_from = local.persistent.secret_google_client_secret_arn
    }
    secret {
      name       = "AUTH_JWT_REFRESH_SECRET"
      value_from = local.persistent.secret_jwt_refresh_secret_arn
    }
    secret {
      name       = "AUTH_JWT_SECRET"
      value_from = local.persistent.secret_jwt_secret_arn
    }
    secret {
      name       = "AUTH_SESSION_SECRET"
      value_from = local.persistent.secret_session_secret_arn
    }
    secret {
      name       = "AUTH_TWITTER_CLIENT_SECRET"
      value_from = local.persistent.secret_twitter_client_secret_arn
    }
    secret {
      name       = "DATABASE_URL"
      value_from = local.persistent.secret_database_url_arn
    }
    secret {
      name       = "SMTP_PASS"
      value_from = local.persistent.secret_smtp_pass_arn
    }
  }
}
