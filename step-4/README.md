# Step 4 — Next.js + NestJS with Items CRUD on ECS Express Mode

Next.js frontend and a NestJS backend with health check (Git SHA) and Items CRUD (PostgreSQL + Prisma), deployed to Amazon ECS Express Mode.

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

## Prerequisites

- Docker Engine + Docker Compose (e.g. [Docker Desktop](https://www.docker.com/products/docker-desktop/), [Podman](https://podman.io/), [Colima](https://github.com/abiosoft/colima))
- An AWS account with administrator access (optional — needed only if you want to deploy to the cloud)
- A GitHub repository (optional — needed only if you want to use the GitHub Actions CI/CD workflows in `.github/`)

## Run This Step

```sh
cp .example.env .env               # Edit if needed — see comments inside
cp .example.secrets.env .secrets.env
docker compose up
```

> **Security note:** This workshop places secrets in `.secrets.env` for simplicity. In production, use a secrets manager (e.g. AWS Secrets Manager) instead of local files. Be aware that AI coding agents can read files in your working directory — never place production credentials in `.secrets.env`. The example defaults are safe for local development. `.secrets.env` is excluded from Git via `*.env` in `.gitignore`.

| URL | Description |
|-----|-------------|
| http://localhost:4000/health | Backend health check |
| http://localhost:4000/api | Swagger UI |
| http://localhost:3000 | Web |

## Run E2E Tests

```sh
docker compose --profile=e2e-tests run --rm web-e2e-tests
```

## Cloud Deployment (Terraform)

This is an ECS workshop, so we **recommend deploying to AWS** to get the full experience. All Terraform commands run via `docker compose`, so no local Terraform installation is required. If you don't have an AWS account yet, you can still proceed with local development and deploy later.

> **Cost note:** ECS and related resources incur hourly charges while running. When you're done for the day, destroy the ephemeral layer to avoid unexpected costs:
> ```sh
> docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral destroy -var-file=terraform.tfvars
> ```
> You can re-create it anytime with `terraform apply`. See the top-level [README](../README.md#time--cost-estimate) for cost estimates.

See [docs/cloud-deployment-aws.md](docs/cloud-deployment-aws.md) for full details. Quick summary:

```sh
# 1. Configure variables
cp iac/aws/terraform.tfvars.example iac/aws/terraform.tfvars
cp iac/aws/ephemeral/terraform.tfvars.example iac/aws/ephemeral/terraform.tfvars
# Edit terraform.tfvars and set app_unique_id (e.g. "my-workshop")
# APP_UNIQUE_ID is a unique prefix used for all AWS resource names (ECR repos, Secrets Manager keys, etc.)

# 2. Deploy persistent infrastructure (VPC, ECR, IAM, Secrets Manager)
source .env
docker compose --profile=iac run --rm iac terraform -chdir=aws init \
  -backend-config="bucket=$AWS_TF_STATE_BUCKET" \
  -backend-config="region=$AWS_TF_STATE_REGION"
docker compose --profile=iac run --rm iac terraform -chdir=aws apply -var-file=terraform.tfvars

# 3. Build and push Docker images to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker build -f Dockerfiles.d/backend-build/Dockerfile \
  -t $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-backend:latest \
  backend
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-backend:latest
docker build -f Dockerfiles.d/web-build/Dockerfile \
  -t $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-web:latest \
  web/app
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${APP_UNIQUE_ID}-web:latest

# 4. Deploy ephemeral infrastructure (ECS Express Gateway, RDS)
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral init \
  -backend-config="bucket=$AWS_TF_STATE_BUCKET" \
  -backend-config="region=$AWS_TF_STATE_REGION"
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral apply -var-file=terraform.tfvars
```

### Secrets

Before running the prompts, the only secret is `DATABASE_URL`, which is **automatically populated** by the ephemeral layer Terraform from the RDS endpoint.

After completing the prompts, the AI agent will add `AUTH_JWT_SECRET` and `AUTH_JWT_REFRESH_SECRET` to Secrets Manager. You must populate them manually:

```sh
aws secretsmanager put-secret-value \
  --secret-id "${APP_UNIQUE_ID}/backend/AUTH_JWT_SECRET" \
  --secret-string "$(openssl rand -base64 32)"
aws secretsmanager put-secret-value \
  --secret-id "${APP_UNIQUE_ID}/backend/AUTH_JWT_REFRESH_SECRET" \
  --secret-string "$(openssl rand -base64 32)"
```

## Implementation via AI Agent

To prepare for the next step (step-5), you can have an AI agent (such as [Claude Code](https://claude.ai/claude-code), [Cursor](https://www.cursor.com/), [GitHub Copilot](https://github.com/features/copilot), or [ChatGPT](https://chatgpt.com/)) generate the code for you.

Copy the contents of [prompts.md](prompts.md) in this directory and provide them to your AI agent. If executed correctly, you will have an environment equivalent to step-5 without manual intervention.

<details>
<summary><strong>Glossary: CRUD (Click to expand)</strong></summary>

**What is CRUD?**

CRUD stands for **C**reate, **R**ead, **U**pdate, **D**elete — the four basic operations for managing data. Almost every application with a database implements these operations. For example, in this workshop's Items feature:

- **Create** — `POST /items` adds a new item
- **Read** — `GET /items` lists items
- **Update** — (not used in this step, but would modify an existing item)
- **Delete** — `DELETE /items/:id` removes an item

When someone says "Items CRUD," they mean a complete set of API endpoints and UI for managing items. Understanding CRUD is fundamental because most web applications are built around these operations on different resources (users, posts, orders, etc.).

</details>

<details>
<summary><strong>Glossary: JWT (Click to expand)</strong></summary>

**What is JWT?**

JWT (JSON Web Token) is a compact, URL-safe token format used for authentication. When a user signs in, the server creates a signed token containing the user's identity (e.g., user ID and email). The client stores this token and sends it with each request in the `Authorization: Bearer <token>` header. The server verifies the signature without needing to look up a session in the database, making it stateless and scalable. In this workshop, we use two JWTs: an **access token** (short-lived, for API requests) and a **refresh token** (longer-lived, for obtaining new access tokens).

</details>

<details>
<summary><strong>Glossary: Secrets Management & AWS Secrets Manager (Click to expand)</strong></summary>

**What is secrets management?**

Secrets management is the practice of securely storing, accessing, and rotating sensitive values — such as database passwords, API keys, and JWT signing keys — outside of your application code and configuration files. Hardcoding secrets in source code or environment files is risky: they can be accidentally committed to version control, leaked in logs, or exposed through CI/CD artifacts. A secrets management system solves this by providing a centralized, encrypted store where secrets are kept at rest and delivered to applications at runtime.

**Why use AWS Secrets Manager?**

[AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) is a managed service that encrypts secrets at rest, controls access via IAM policies, and integrates directly with AWS services like ECS. In this workshop, ECS tasks retrieve secrets from Secrets Manager at startup — the container never sees plaintext secrets in its task definition or environment files. This means you can rotate a secret in one place without redeploying your application code.

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

If you deployed to AWS, you can also access the same application from Amazon ECS. Run the following command to get the URL:

```sh
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral output web_url
```

Open the output URL in your browser to confirm it works.

**Cleanup before moving to the next step:**

```bash
docker compose down --remove-orphans
```

> This step uses a database volume. If you want to reset the database, use `docker compose down --remove-orphans -v` instead.

<details>
<summary><strong>Leaving the workshop? Destroy your cloud infrastructure too (Click to expand)</strong></summary>

If you deployed to AWS and want to stop the workshop, destroy your cloud resources to avoid ongoing charges:

```sh
# 1. Destroy ephemeral layer (ECS, RDS, etc.)
source .env
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral destroy -var-file=terraform.tfvars

# 2. Destroy persistent layer (VPC, ECR, IAM, Secrets Manager)
docker compose --profile=iac run --rm iac terraform -chdir=aws destroy -var-file=terraform.tfvars
```

</details>

---

[Prev: step-3 — Next.js + NestJS (health check)](../step-3/README.md) | [Next: step-5 — Next.js + NestJS with Auth + Items CRUD](../step-5/README.md)
