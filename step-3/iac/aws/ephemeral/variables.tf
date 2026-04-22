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
