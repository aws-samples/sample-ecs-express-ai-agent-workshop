# Before running `terraform init`, create a state backend:
#
# S3:
#   aws s3api create-bucket --bucket <BUCKET_NAME> --region us-east-1
#   aws s3api put-bucket-versioning --bucket <BUCKET_NAME> \
#     --versioning-configuration Status=Enabled
#
# Then update the backend block below.

terraform {
  required_version = ">= 1.10"

  backend "s3" {
    bucket       = "REPLACE_WITH_YOUR_BUCKET_NAME"
    key          = "terraform/state/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.38"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
