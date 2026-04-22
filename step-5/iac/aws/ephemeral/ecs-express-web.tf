resource "aws_ecs_express_gateway_service" "web" {
  service_name            = "${var.app_unique_id}-web"
  execution_role_arn      = local.persistent.ecs_execution_role_arn
  infrastructure_role_arn = local.persistent.ecs_infrastructure_role_arn
  cpu                     = "256"
  memory                  = "512"

  network_configuration {
    subnets         = [local.persistent.subnet_public_a_id, local.persistent.subnet_public_b_id]
    security_groups = [local.persistent.sg_ecs_web_id]
  }

  scaling_target {
    min_task_count              = 1
    max_task_count              = 2
    auto_scaling_metric         = "AVERAGE_CPU"
    auto_scaling_target_value   = 60
  }

  primary_container {
    image          = "${local.persistent.ecr_web_repository_url}:${var.image_tag}"
    container_port = 3000

    environment {
      name  = "BACKEND_URL"
      value = aws_ecs_express_gateway_service.backend.ingress_paths[0].endpoint
    }
    environment {
      name  = "PORT"
      value = "3000"
    }
  }
}
