# Prompts to grow step-1 into step-2

Use the following prompts in order with the AI agent to evolve this empty Next.js app into a deployable project on AWS ECS Express Mode.

## 1. Add a production Dockerfile for the web app

Could you create a production Dockerfile at `Dockerfiles.d/web-build/Dockerfile` that builds the Next.js app as a standalone output and runs it with `node server.js`? It should use a multi-stage build with `node:24-bookworm-slim`, accept a `GIT_SHA` build arg, and produce a minimal final image.

## 2. Add Terraform IaC for AWS persistent infrastructure

Could you create Terraform configuration under `iac/aws/` for persistent AWS infrastructure? It should include:
- A VPC with two public subnets across two AZs, an internet gateway, and route tables
- A security group for ECS web tasks (port 3000)
- An ECR repository for the web image
- IAM roles for ECS task execution and ECS Express infrastructure
- An S3 backend for Terraform state (configured via `-backend-config` at init time)
- A `terraform.tfvars.example` with `app_unique_id` and `aws_region`
- A Dockerfile at `Dockerfiles.d/iac/Dockerfile` based on `hashicorp/terraform` for running Terraform via Docker Compose

## 3. Add Terraform IaC for AWS ephemeral infrastructure

Could you create Terraform configuration under `iac/aws/ephemeral/` for ephemeral AWS infrastructure? It should include:
- A `remote-state.tf` that reads outputs from the persistent layer via `terraform_remote_state`
- An ECS Express Gateway service for the web app (port 3000, 256 CPU, 512 MiB memory, auto-scaling 1-2 tasks) using the ECR image from the persistent layer
- Variables for `app_unique_id`, `aws_region`, `aws_tf_state_bucket`, `aws_tf_state_region`, `image_tag`, and `frontend_url`
- Outputs for the web service URL
- A `terraform.tfvars.example`

## 4. Add an IaC service to compose.yaml

Could you add an `iac` service to `compose.yaml` that uses `Dockerfiles.d/iac/Dockerfile`, mounts `~/.aws` as read-only, passes AWS and Terraform environment variables from `.env`, and runs under the `iac` profile?

## 5. Add AWS environment variables to .env

Could you add AWS and Terraform variables to `.env` and `.example.env`? Include `AWS_PROFILE`, `AWS_IAM_ROLE_ARN`, `AWS_TF_STATE_BUCKET`, `AWS_TF_STATE_REGION`, `AWS_REGION`, `APP_UNIQUE_ID`, `FRONTEND_URL`, and `IMAGE_TAG`.

## 6. Add GitHub Actions workflow for web E2E tests

Could you create a GitHub Actions workflow at `.github/workflows/web.e2e-tests.yaml` that runs the Playwright E2E tests via `docker compose --profile e2e-tests` on push/PR to main when web or Dockerfiles change?

## 7. Add GitHub Actions workflow for web image build and push

Could you create a reusable GitHub Actions workflow at `.github/workflows/_reusable-web-build.yaml` that builds and pushes the web Docker image to GHCR and optionally to AWS ECR (using OIDC for AWS auth and Terraform outputs for the ECR repo URL)? And a caller workflow at `.github/workflows/web.build.yaml` that triggers it for Staging and Production environments?

## 8. Add GitHub Actions workflows for IaC (Terraform)

Could you create GitHub Actions workflows for Terraform:
- `.github/workflows/_reusable-iac.yaml` — reusable workflow for persistent layer plan/apply (AWS only)
- `.github/workflows/iac.yaml` — caller for persistent layer, triggered on push/PR to main when `iac/aws/*` changes
- `.github/workflows/iac.ephemeral.yaml` — manual dispatch workflow for ephemeral layer (plan/apply/destroy)
- `.github/actions/bootstrap-tfstate-s3/action.yaml` — composite action to create the S3 state bucket if it doesn't exist

## 9. Add OIDC setup documentation

Could you create `docs/oidc-setup.md` documenting how to set up AWS IAM OIDC provider and IAM role for GitHub Actions?

## 10. Add cloud deployment documentation

Could you create documentation for deploying to AWS ECS Express Mode:
- `docs/cloud-deployment.md` — overview of the deployment architecture (persistent + ephemeral layers)
- `docs/cloud-deployment-aws.md` — step-by-step guide for AWS deployment (create state bucket, configure tfvars, apply persistent, push images, apply ephemeral)
- `docs/ci.md` — CI/CD workflows overview, required GitHub Actions variables and secrets

## 11. Add git SHA display documentation

Could you create `docs/git-sha-display.md` documenting how the Git SHA is injected into the web app at build time?
