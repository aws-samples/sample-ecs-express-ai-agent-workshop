variable "app_unique_id" {
  description = "Unique identifier used as a prefix for all resource names"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# -----------------------------------------------------------------------------
# Terraform remote state (persistent layer)
# -----------------------------------------------------------------------------

variable "aws_tf_state_bucket" {
  description = "S3 bucket storing the persistent layer's Terraform state"
  type        = string
}

variable "aws_tf_state_region" {
  description = "AWS region of the S3 state bucket"
  type        = string
  default     = "us-east-1"
}

# -----------------------------------------------------------------------------
# Container image tag
# The registry URL is derived from the persistent layer's ECR repository outputs.
# -----------------------------------------------------------------------------

variable "image_tag" {
  description = "Container image tag (e.g. latest, sha-abc1234)"
  type        = string
  default     = "latest"
}

# -----------------------------------------------------------------------------
# RDS
# -----------------------------------------------------------------------------

variable "database_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "database_password" {
  description = "PostgreSQL user password"
  type        = string
  sensitive   = true
}

variable "database_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "app"
}

variable "database_user" {
  description = "PostgreSQL user name"
  type        = string
  default     = "appuser"
}

# -----------------------------------------------------------------------------
# JWT
# Secrets (jwt_secret, jwt_refresh_secret) are populated externally in
# Secrets Manager. Only non-sensitive config is managed here.
# -----------------------------------------------------------------------------

variable "jwt_access_expiration" {
  description = "JWT access token expiration (e.g. 15m)"
  type        = string
  default     = "15m"
}

variable "jwt_refresh_expiration" {
  description = "JWT refresh token expiration (e.g. 7d)"
  type        = string
  default     = "7d"
}

# -----------------------------------------------------------------------------
# OAuth2 — Apple
# -----------------------------------------------------------------------------

variable "apple_client_id" {
  description = "Apple Services ID"
  type        = string
}

variable "apple_team_id" {
  description = "Apple Team ID"
  type        = string
}

variable "apple_key_id" {
  description = "Apple Key ID"
  type        = string
}

# -----------------------------------------------------------------------------
# OAuth2 — Discord
# -----------------------------------------------------------------------------

variable "discord_client_id" {
  description = "Discord OAuth2 Client ID"
  type        = string
}

# -----------------------------------------------------------------------------
# OAuth2 — GitHub
# -----------------------------------------------------------------------------

variable "gh_client_id" {
  description = "GitHub OAuth App Client ID"
  type        = string
}

# -----------------------------------------------------------------------------
# OAuth2 — Google
# -----------------------------------------------------------------------------

variable "google_oauth_client_id" {
  description = "Google OAuth2 Client ID"
  type        = string
}

# -----------------------------------------------------------------------------
# OAuth2 — X (Twitter)
# -----------------------------------------------------------------------------

variable "twitter_client_id" {
  description = "X (Twitter) OAuth2 Client ID"
  type        = string
}

# -----------------------------------------------------------------------------
# SMTP
# SMTP_PASS is populated externally in Secrets Manager.
# Only non-sensitive config is managed here.
# -----------------------------------------------------------------------------

variable "smtp_host" {
  description = "SMTP server hostname"
  type        = string
}

variable "smtp_port" {
  description = "SMTP server port"
  type        = string
  default     = "587"
}

variable "smtp_secure" {
  description = "Use implicit TLS (true for port 465, false for STARTTLS on port 587)"
  type        = string
  default     = "false"
}

variable "smtp_user" {
  description = "SMTP username (e.g. SES IAM SMTP credential)"
  type        = string
}

variable "smtp_from" {
  description = "From address for outgoing emails"
  type        = string
}

# -----------------------------------------------------------------------------
# Native app
# -----------------------------------------------------------------------------

variable "native_app_url_scheme" {
  description = "Native app URL scheme for OAuth2 callbacks"
  type        = string
}

# -----------------------------------------------------------------------------
# Service URLs
# After the first deployment, set these to the ECS Express Gateway endpoints.
# -----------------------------------------------------------------------------

variable "frontend_url" {
  description = "Frontend (web) URL, e.g. the ECS Express Gateway endpoint for the web service"
  type        = string
  default     = ""
}

variable "backend_url" {
  description = "Backend URL, e.g. the ECS Express Gateway endpoint for the backend service"
  type        = string
  default     = ""
}
