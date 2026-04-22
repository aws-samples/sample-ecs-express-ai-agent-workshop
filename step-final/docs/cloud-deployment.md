# Cloud Deployment

Deploy the backend and web services to AWS.

## Deployment methods

There are two ways to deploy:

- **Manual (Terraform CLI)** — Follow the provider-specific instructions linked below
- **CI/CD (GitHub Actions)** — Automate deployment via GitHub Actions. See [CI / GitHub Actions](ci.md)

## Production images

Before deploying, build production Docker images:

```sh
# Build backend image
docker build \
  -f Dockerfiles.d/backend-build/Dockerfile \
  -t myregistry/backend:latest \
  backend

# Build web image
docker build \
  -f Dockerfiles.d/web-build/Dockerfile \
  -t myregistry/web:latest \
  web/app
```

The resulting images contain compiled output and pruned dependencies. Push them to ECR before deploying. See the [AWS deployment guide](cloud-deployment-aws.md) for registry authentication and image push commands.

## Architecture: persistent + ephemeral layers

The Terraform configuration has two layers:

- **Persistent** (`iac/aws/`) — Container registries, IAM roles, VPC/subnets. Low cost (~$0-5/month). Always running.
- **Ephemeral** (`iac/aws/ephemeral/`) — Databases, compute services, VPC connectors. Higher cost (~$170-210/month). Create for testing, destroy when done.

The ephemeral layer reads outputs from the persistent layer via `terraform_remote_state` (see `remote-state.tf` in the ephemeral directory).

## Secrets

AWS Secrets Manager stores 10 backend secrets (JWT keys, OAuth2 client secrets, etc.). The persistent layer creates empty secret containers; 8 of the 9 must be populated manually before deploying the ephemeral layer. See [Secrets Management](secrets.md) for the full list, naming conventions, and CLI commands.

## Terraform commands

All commands run via Docker Compose with `-chdir` to select the layer:

```sh
docker compose --profile=iac run --rm iac terraform -chdir=aws init \
  -backend-config="bucket=my-tf-state-bucket" \
  -backend-config="region=us-east-1"
docker compose --profile=iac run --rm iac terraform -chdir=aws apply -var-file=terraform.tfvars

docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral init \
  -backend-config="bucket=my-tf-state-bucket" \
  -backend-config="region=us-east-1"
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral apply -var-file=terraform.tfvars
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral destroy -var-file=terraform.tfvars
```

## Using staging environment variables

To use staging-specific files (`.staging.env` and `.staging.secrets.env`), pass them via `--env-file`:

```sh
docker compose --env-file .staging.env --env-file .staging.secrets.env \
  --profile=iac run --rm iac \
  terraform -chdir=aws/ephemeral apply
```

## Provider guide

- [AWS ECS Express Mode](cloud-deployment-aws.md)
