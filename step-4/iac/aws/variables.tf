variable "app_unique_id" {
  description = "Unique identifier used as a prefix for all resource names"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}
