output "backend_url" {
  description = "Backend ECS Express service URL"
  value       = aws_ecs_express_gateway_service.backend.ingress_paths[0].endpoint
}

output "web_url" {
  description = "Web ECS Express service URL"
  value       = aws_ecs_express_gateway_service.web.ingress_paths[0].endpoint
}

output "database_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.main.endpoint
}
