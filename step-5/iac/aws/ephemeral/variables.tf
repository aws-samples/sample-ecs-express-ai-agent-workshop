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
# Service URLs
# -----------------------------------------------------------------------------

variable "frontend_url" {
  description = "Frontend (web) URL"
  type        = string
  default     = ""
}

variable "backend_url" {
  description = "Backend URL"
  type        = string
  default     = ""
}
