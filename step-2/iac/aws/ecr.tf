resource "aws_ecr_repository" "web" {
  name                 = "${var.app_unique_id}-web"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}
