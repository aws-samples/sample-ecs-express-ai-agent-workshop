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

output "sg_ecs_backend_id" {
  description = "Security group ID for ECS backend tasks"
  value       = aws_security_group.ecs_backend.id
}

output "sg_ecs_web_id" {
  description = "Security group ID for ECS web tasks"
  value       = aws_security_group.ecs_web.id
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
