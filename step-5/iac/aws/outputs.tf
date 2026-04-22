# -----------------------------------------------------------------------------
# VPC networking (referenced by ephemeral layer)
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "subnet_public_a_id" {
  description = "Public subnet A ID"
  value       = aws_subnet.public_a.id
}

output "subnet_public_b_id" {
  description = "Public subnet B ID"
  value       = aws_subnet.public_b.id
}

output "subnet_private_a_id" {
  description = "Private subnet A ID"
  value       = aws_subnet.private_a.id
}

output "subnet_private_b_id" {
  description = "Private subnet B ID"
  value       = aws_subnet.private_b.id
}

output "private_route_table_id" {
  description = "Private route table ID (NAT route added by ephemeral layer)"
  value       = aws_route_table.private.id
}

output "sg_ecs_backend_id" {
  description = "Security group ID for ECS backend tasks"
  value       = aws_security_group.ecs_backend.id
}

output "sg_ecs_web_id" {
  description = "Security group ID for ECS web tasks"
  value       = aws_security_group.ecs_web.id
}

output "sg_rds_id" {
  description = "Security group ID for RDS PostgreSQL"
  value       = aws_security_group.rds.id
}

# -----------------------------------------------------------------------------
# ECR (referenced by ephemeral layer)
# -----------------------------------------------------------------------------

output "ecr_backend_repository_url" {
  description = "ECR backend repository URL for docker push"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_web_repository_url" {
  description = "ECR web repository URL for docker push"
  value       = aws_ecr_repository.web.repository_url
}

output "ecs_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = aws_iam_role.ecs_execution.arn
}

output "ecs_infrastructure_role_arn" {
  description = "ECS Express infrastructure role ARN"
  value       = aws_iam_role.ecs_infrastructure.arn
}

# -----------------------------------------------------------------------------
# Secrets Manager ARNs (referenced by ephemeral layer)
# -----------------------------------------------------------------------------

output "secret_database_url_arn" {
  description = "Secrets Manager ARN for DATABASE_URL"
  value       = aws_secretsmanager_secret.backend_database_url.arn
}

output "secret_jwt_secret_arn" {
  description = "Secrets Manager ARN for AUTH_JWT_SECRET"
  value       = aws_secretsmanager_secret.backend_jwt_secret.arn
}

output "secret_jwt_refresh_secret_arn" {
  description = "Secrets Manager ARN for AUTH_JWT_REFRESH_SECRET"
  value       = aws_secretsmanager_secret.backend_jwt_refresh_secret.arn
}
