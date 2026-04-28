# Amazon ECS Express Mode

See [Cloud Deployment](cloud-deployment.md) for production image builds and architecture overview.

## Prerequisites

- An AWS account with appropriate permissions
- AWS CLI installed on the host
- Docker Engine + Docker Compose running (Terraform runs inside a container)

### Authenticate with AWS on the host

The `iac` container mounts `~/.aws` as read-only, so credentials configured on the host are automatically available inside the container.

**Option A — Long-lived credentials (IAM user)**

```sh
aws configure
# Enter your Access Key ID, Secret Access Key, default region, and output format.
# This writes to ~/.aws/credentials and ~/.aws/config.
```

**Option B — SSO / Identity Center**

```sh
aws configure sso
# Follow the prompts to set up an SSO profile.

aws sso login --profile YOUR_PROFILE
```

List available profiles to find the correct name:

```sh
aws configure list-profiles
```

When using an SSO profile, set the `AWS_PROFILE` environment variable so the container picks it up:

```sh
export AWS_PROFILE=YOUR_PROFILE
```

Or add `AWS_PROFILE` to your `.secrets.env` file — the `iac` service loads it via `env_file`.

**Verify**

```sh
aws sts get-caller-identity
```

If this returns your account and ARN, the credentials are ready and will be available in the `iac` container.

## 1. Create the Terraform state bucket

```sh
aws s3api create-bucket --bucket YOUR_BUCKET_NAME --region us-east-1
aws s3api put-bucket-versioning --bucket YOUR_BUCKET_NAME \
  --versioning-configuration Status=Enabled
```

Set the bucket name in `.env` as `AWS_TF_STATE_BUCKET` and pass it via `-backend-config` at `terraform init` time (see step 3), so you do not need to edit `versions.tf`.

## 2. Configure variables

```sh
cp iac/aws/terraform.tfvars.example iac/aws/terraform.tfvars
cp iac/aws/ephemeral/terraform.tfvars.example iac/aws/ephemeral/terraform.tfvars
```

Edit `iac/aws/terraform.tfvars`:

- `aws_region` — your AWS region (default: `us-east-1`)

Edit `iac/aws/ephemeral/terraform.tfvars`:

- `database_password` — generate with `openssl rand -base64 32`
- OAuth2 client IDs (`apple_client_id`, `discord_client_id`, `gh_client_id`, `google_oauth_client_id`, `twitter_client_id`) and Apple config (`apple_team_id`, `apple_key_id`)
- `native_app_url_scheme` — e.g. `oauth2app`
- `frontend_url` / `backend_url` — set after first deployment to the ECS Express Gateway endpoints

> **Note:** JWT secrets, session secret, and OAuth2 client secrets are stored directly in Secrets Manager — populate them externally (CLI or AWS Console), not via Terraform.

## 3. Create persistent infrastructure and push images

```sh
source .env
docker compose --profile=iac run --rm iac terraform -chdir=aws init \
  -backend-config="bucket=$AWS_TF_STATE_BUCKET" \
  -backend-config="region=$AWS_TF_STATE_REGION"
docker compose --profile=iac run --rm iac terraform -chdir=aws apply -var-file=terraform.tfvars
```

> **Note:** On a fresh AWS account that has never used ECS, the first `terraform apply` may fail because the `AWSServiceRoleForECS` service-linked role does not yet exist. AWS creates this role automatically in the background, so simply re-running `terraform apply` will succeed.

Then build and push the production images (the registry URL comes from the persistent layer output):

```sh
# Authenticate Docker with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build \
  -f Dockerfiles.d/backend-build/Dockerfile \
  -t ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/oauth2-app-backend:latest \
  backend
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/oauth2-app-backend:latest

# Build and push web
docker build \
  -f Dockerfiles.d/web-build/Dockerfile \
  -t ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/oauth2-app-web:latest \
  web/app
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/oauth2-app-web:latest
```

The ephemeral layer derives the registry URL from the persistent layer's ECR repository outputs. The `image_tag` variable defaults to `latest`.

## 4. Deploy ephemeral infrastructure

```sh
source .env
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral init \
  -backend-config="bucket=$AWS_TF_STATE_BUCKET" \
  -backend-config="region=$AWS_TF_STATE_REGION"
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral apply -var-file=terraform.tfvars
```

After the first apply, retrieve the ECS Express Gateway endpoints from the output, set `frontend_url` and `backend_url` in your `terraform.tfvars`, and re-apply to configure CORS and OAuth callback URLs. Verify the deployed URLs:

```sh
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral output
```

## 5. Tear down (after testing)

```sh
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral destroy -var-file=terraform.tfvars
```

Persistent ECR repositories remain — images are available for the next test cycle.

## Resources created

| Layer | Resource | Description |
|-------|----------|-------------|
| Persistent | ECR | Docker image repositories (backend + web) |
| Persistent | VPC | Custom VPC with public + private subnets across 2 AZs |
| Persistent | Internet Gateway | Public subnet internet access |
| Persistent | Security Groups | Backend (4000), Web (3000), RDS (5432) |
| Persistent | IAM Roles | ECS task execution role + ECS Express infrastructure role |
| Persistent | Secrets Manager | 9 backend secrets (empty containers) |
| Ephemeral | NAT Gateway | Private subnet outbound access (ECR image pull) |
| Ephemeral | RDS (PostgreSQL 17) | Database instance (`db.t4g.micro`) in private subnet |
| Ephemeral | ECS Express (backend) | NestJS API on port 4000, auto-scaling 1-2 tasks |
| Ephemeral | ECS Express (web) | Static site + reverse proxy on port 3000, auto-scaling 1-2 tasks |

> **Note:** RDS has `skip_final_snapshot = true` and NAT Gateway incurs cost even when idle. Adjust for production use.
