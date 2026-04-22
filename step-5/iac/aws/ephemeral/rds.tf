resource "aws_db_subnet_group" "main" {
  name = var.app_unique_id
  subnet_ids = [
    local.persistent.subnet_private_a_id,
    local.persistent.subnet_private_b_id,
  ]

  tags = {
    Name = "${var.app_unique_id}"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.app_unique_id}-db"
  engine         = "postgres"
  engine_version = "17"
  instance_class = var.database_instance_class

  db_name  = var.database_name
  username = var.database_user
  password = var.database_password

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [local.persistent.sg_rds_id]

  publicly_accessible = false
  multi_az            = false
  skip_final_snapshot = true

  tags = {
    Name = "${var.app_unique_id}-db"
  }
}
