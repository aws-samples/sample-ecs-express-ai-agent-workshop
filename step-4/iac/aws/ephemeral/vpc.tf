# -----------------------------------------------------------------------------
# NAT gateway (for private subnet internet access — ECR image pull)
# EIP + NAT gateway incur cost (~$36/month) so they stay in the ephemeral layer.
# VPC, subnets, IGW, route tables, and security groups are in the persistent layer.
# -----------------------------------------------------------------------------

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${var.app_unique_id}-nat-eip"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = local.persistent.subnet_public_a_id

  tags = {
    Name = "${var.app_unique_id}-nat"
  }
}

# Add NAT route to the persistent private route table.
resource "aws_route" "private_nat" {
  route_table_id         = local.persistent.private_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main.id
}
