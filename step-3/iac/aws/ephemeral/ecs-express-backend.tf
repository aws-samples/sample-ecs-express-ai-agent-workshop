resource "aws_ecs_express_gateway_service" "backend" {
  service_name            = "${var.app_unique_id}-backend"
  execution_role_arn      = local.persistent.ecs_execution_role_arn
  infrastructure_role_arn = local.persistent.ecs_infrastructure_role_arn
  cpu                     = "256"
  memory                  = "512"
  health_check_path       = "/health"

  network_configuration {
    subnets         = [local.persistent.subnet_public_a_id, local.persistent.subnet_public_b_id]
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
      name  = "PORT"
      value = "4000"
    }
  }
}
