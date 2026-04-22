# Step 4 — Next.js + NestJS with Items CRUD on ECS Express Mode

Next.js frontend and a NestJS backend with health check (Git SHA) and Items CRUD (PostgreSQL + Prisma), deployed to AWS ECS Express Mode.

## Services

| Service | Technology | Port |
|---------|-----------|------|
| backend | NestJS 11 + PostgreSQL 17 + Prisma | 4000 |
| web | Next.js 16 | 3000 |

## Architecture at Start

The following diagram shows what you **already have** when you begin this step — not the final goal. See [Expected Output After Completion](#expected-output-after-completion) for what you will build.

```mermaid
graph TB
    subgraph Local ["Local Development"]
        direction LR
        Web["Web<br/>Next.js :3000"]
        Backend["Backend<br/>NestJS :4000"]
        DB_Local["PostgreSQL :5432"]
        E2E["E2E Tests<br/>Playwright"]
        Web -->|API| Backend
        Backend --> DB_Local
        E2E -.->|tests| Web
    end

    subgraph AWS ["AWS Cloud"]
        subgraph Persistent ["Persistent Layer"]
            VPC["VPC"]
            ECR["ECR"]
            IAM["IAM Roles"]
            SG["Security Groups"]
            SM["Secrets Manager<br/>DATABASE_URL"]
        end
        subgraph Ephemeral ["Ephemeral Layer"]
            ECS_Web["ECS Express<br/>Web :3000"]
            ECS_Backend["ECS Express<br/>Backend :4000"]
            RDS["RDS<br/>PostgreSQL"]
            NAT["NAT Gateway"]
        end
    end

    ECS_Web -->|API| ECS_Backend
    ECS_Backend --> RDS
    SM -.->|inject| ECS_Backend
```

## Prerequisites

- Docker Engine + Docker Compose (e.g. [Docker Desktop](https://www.docker.com/products/docker-desktop/), [Podman](https://podman.io/), [Colima](https://github.com/abiosoft/colima))
- A GitHub repository (optional — needed only if you want to use the GitHub Actions CI/CD workflows in `.github/`)

## Quick Start

```sh
cp .example.secrets.env .secrets.env
docker compose up
```

| URL | Description |
|-----|-------------|
| http://localhost:4000/health | Backend health check |
| http://localhost:4000/api | Swagger UI |
| http://localhost:3000 | Web |

## Run E2E Tests

```sh
docker compose --profile=e2e-tests run --rm web-e2e-tests
```

## Project Structure

```
.
├── compose.yaml
├── backend/               # NestJS API (health check + items CRUD)
│   └── prisma/            # Prisma schema (Item model)
├── web/
│   ├── app/               # Next.js App Router
│   └── e2e-tests/         # Playwright E2E tests
├── iac/                   # Terraform IaC (AWS)
├── Dockerfiles.d/
├── .github/               # GitHub Actions workflows + custom actions
└── docs/
```

## Cloud Deployment (Terraform)

See [docs/cloud-deployment-aws.md](docs/cloud-deployment-aws.md) for full details. Quick summary:

```sh
# 1. Configure variables
cp iac/aws/terraform.tfvars.example iac/aws/terraform.tfvars
cp iac/aws/ephemeral/terraform.tfvars.example iac/aws/ephemeral/terraform.tfvars

# 2. Deploy persistent infrastructure (VPC, ECR, IAM, Secrets Manager)
source .env
docker compose --profile=iac run --rm iac terraform -chdir=aws init \
  -backend-config="bucket=$AWS_TF_STATE_BUCKET" \
  -backend-config="region=$AWS_TF_STATE_REGION"
docker compose --profile=iac run --rm iac terraform -chdir=aws apply -var-file=terraform.tfvars

# 3. Build and push Docker images to ECR, then deploy ephemeral infrastructure (ECS Express Gateway, RDS)
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral init \
  -backend-config="bucket=$AWS_TF_STATE_BUCKET" \
  -backend-config="region=$AWS_TF_STATE_REGION"
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral apply -var-file=terraform.tfvars
```

### Build and Push Images

After deploying the persistent layer, build and push the production images before deploying the ephemeral layer:

```sh
# Authenticate Docker with ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push backend
docker build -f Dockerfiles.d/backend-build/Dockerfile \
  -t $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-backend:latest \
  backend
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-backend:latest

# Build and push web
docker build -f Dockerfiles.d/web-build/Dockerfile \
  -t $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-web:latest \
  web/app
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-web:latest
```

### Secrets

In this step, the only secret is `DATABASE_URL`, which is **automatically populated** by the ephemeral layer Terraform from the RDS endpoint. No manual secret setup is required.

## Implementation via AI Agent

To prepare for the next step (step-5), you can have an AI agent (such as [Claude Code](https://claude.ai/claude-code), [Cursor](https://www.cursor.com/), [GitHub Copilot](https://github.com/features/copilot), or [ChatGPT](https://chatgpt.com/)) generate the code for you.

Copy the contents of [prompts.md](prompts.md) in this directory and provide them to your AI agent. If executed correctly, you will have an environment equivalent to step-5 without manual intervention.

<details>
<summary><strong>Glossary: JWT (Click to expand)</strong></summary>

**What is JWT?**

JWT (JSON Web Token) is a compact, URL-safe token format used for authentication. When a user signs in, the server creates a signed token containing the user's identity (e.g., user ID and email). The client stores this token and sends it with each request in the `Authorization: Bearer <token>` header. The server verifies the signature without needing to look up a session in the database, making it stateless and scalable. In this workshop, we use two JWTs: an **access token** (short-lived, for API requests) and a **refresh token** (longer-lived, for obtaining new access tokens).

</details>

## Expected Output After Completion

After completing the prompts, you should have a project equivalent to step-5 with:

- **http://localhost:3000** — Redirects to `/signin` (unauthenticated) or `/dashboard` (authenticated)
- **http://localhost:3000/signup** — Registration form (email + password, 8+ characters)
- **http://localhost:3000/signin** — Sign-in form with email/password
- **http://localhost:3000/dashboard** — User profile showing ID, email, and join date
- **http://localhost:3000/items** — User-scoped items (requires authentication)
- **http://localhost:4000/api** — Swagger UI with Auth + Items endpoints
- Items are now scoped to the authenticated user (ownership check on delete)
- E2E tests verify sign-up flow and authenticated items management

---

[Prev: step-3 — Next.js + NestJS (health check)](../step-3/README.md) | [Next: step-5 — Next.js + NestJS with Auth + Items CRUD](../step-5/README.md)
