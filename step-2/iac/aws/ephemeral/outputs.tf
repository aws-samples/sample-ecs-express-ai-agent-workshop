output "web_url" {
  description = "Web ECS Express service URL"
  value       = aws_ecs_express_gateway_service.web.ingress_paths[0].endpoint
}
