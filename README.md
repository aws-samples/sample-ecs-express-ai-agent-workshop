# ECS Express AI Agent Workshop

A hands-on workshop for developing a Next.js, NestJS, and Prisma application on AWS ECS using an AI agent (such as [Claude Code](https://claude.ai/claude-code)).

Beyond a simple tutorial, the final application you build serves as a production-ready foundation, fully capable of implementing robust user authentication and seamlessly linking with OAuth2 Identity Providers (IdPs).

Each `step-*` directory is a self-contained project snapshot. Use the `prompts.md` in each step to guide the AI agent to write code, provision infrastructure, and evolve the project to the next level — allowing you to experience a modern, AI-driven development workflow firsthand.

## Tech Stack & Why We Chose Them

This workshop utilizes a modern, production-ready technology stack. These tools were chosen not only for their robust features but also because **their structured nature makes them highly predictable and optimal for AI agents (LLMs) to generate and refactor code.**

<details>
<summary><strong>View detailed tech stack and our design choices (Click to expand)</strong></summary>

### Infrastructure & DevOps
* **Amazon ECS Express Mode:** Introduced as the "easy button" for container deployments, automating ALB, networking, and scaling. It removes tedious boilerplate, allowing AI to provision production-grade environments instantly.
* **Terraform (IaC):** The industry standard for declarative infrastructure. AI agents excel at writing HCL, ensuring a seamless and highly reproducible workflow from creation to safe cleanup.
* **Docker & Docker Compose:** Containerization that guarantees consistent execution. AI agents easily generate `docker-compose.yml` configurations for complex, multi-container local environments.

### Application & Database
* **Next.js (Frontend):** The industry-standard React framework, serving as a predictable foundation for rapidly building interactive UIs with AI.
* **NestJS (Backend API):** A TypeScript-based framework with a highly structured, modular architecture (OOP/DI). It makes it incredibly easy for AI to add features and refactor code predictably without breaking existing logic.
* **Prisma (ORM):** A fully type-safe ORM. By simply instructing the AI on the desired structure, it can seamlessly handle schema creation, migrations, and TypeScript type generation.

### Quality Assurance
* **Playwright (E2E Testing):** A modern framework for End-to-End testing. As AI accelerates code generation, prompting the AI to write Playwright tests is the best practice to verify that the generated code actually works.

</details>

## Who is this workshop best for?

This workshop is designed for:

* **Full-stack Developers** who want to experience the future of AI-driven development.
* **Frontend/Backend Engineers** who want to learn how to deploy production-ready applications on AWS without becoming DevOps experts.
* **Tech Leads & Architects** looking for modern infrastructure design patterns (e.g., separating Persistent and Ephemeral layers) that work perfectly with AI generation.

## What you will learn

By the end of this workshop, you will be able to:

* Use AI agents (like Claude Code) to generate, refactor, and test full-stack code.
* Provision AWS infrastructure using Terraform and the new **Amazon ECS Express Mode**.
* Manage a modern Node.js stack (Next.js, NestJS, Prisma) within a containerized environment (Docker).
* Control cloud costs effectively by mastering the "Disposable Environment" pattern.

## Time & Cost Estimate

* **Estimated Time:** 2 - 3 hours
* **Estimated AWS Cost:** Less than $5 (Assuming you destroy the ephemeral layer immediately after the workshop. **Note:** RDS and ECS will incur hourly charges while running.)

## Prerequisites

* **Knowledge:** Basic understanding of TypeScript and Docker. No deep AWS or Terraform expertise is required (the AI will help you!).
* **Environment:**
  * Docker Engine + Docker Compose (e.g. [Docker Desktop](https://www.docker.com/products/docker-desktop/), [Podman](https://podman.io/), [Colima](https://github.com/abiosoft/colima))
  * AWS CLI configured with administrator access
  * An AI agent tool (e.g. [Claude Code](https://claude.ai/claude-code), [Cursor](https://www.cursor.com/), or [GitHub Copilot](https://github.com/features/copilot))

## How to Use

1. Pick a step directory (start with `step-0/`)
2. Open it in your AI agent
3. Follow the prompts in `prompts.md` to build toward the next step
4. Compare your result with the next step directory

## Optional Learning Path: Build from Scratch in Your Own Repository

For a more hands-on experience, you can create your own GitHub repository and build the entire project from zero:

1. Create a new empty GitHub repository and open it in your AI agent
2. Give the AI the contents of `step-0/prompts.md` to generate step-1
3. Commit the result, then continue with `step-1/prompts.md` to build step-2, and so on
4. Repeat until you reach step-final

> **Tip:** If the AI produces broken code at any step, you can copy the corresponding `step-*` directory contents into your repository to reset to a known working state, then continue from there.

## Troubleshooting: When the AI Agent Doesn't Work as Expected

Because Large Language Models (LLMs) are non-deterministic, the code they generate may vary slightly between runs, and you might occasionally encounter errors. This is a natural and expected part of AI-driven development. If you get stuck, try the following steps:

1. **Feed the Error Back to the AI (Self-Healing)** — Don't panic if you encounter a bug or error. Simply copy the error log or terminal output and paste it back to your AI agent, asking it to "fix this error." Prompting the AI to understand the context and troubleshoot its own mistakes is a highly valuable skill and a core part of this learning experience.

2. **Resume from the Working Snapshot (Escape Hatch)** — If the AI gets stuck in a loop, or if the code becomes too broken to easily fix, you have a built-in escape hatch. You can discard your local changes (e.g., using `git checkout .`), or simply move directly to the next `step-*` directory. Because each step directory is a self-contained snapshot of the correctly implemented project, you can always safely resume the workshop from a known working state.

## Steps

### [step-0](step-0/) — Starting from Scratch

Empty directory. Follow the prompts to create everything from scratch.

**Next:** Follow [step-0/prompts.md](step-0/prompts.md) to create a Next.js project with Docker Compose and Playwright E2E tests.

### [step-1](step-1/) — Empty Next.js App

An empty Next.js App Router project with Docker Compose for local development and Playwright E2E tests. No backend, no infrastructure.

**What you have:**
- Next.js 16 App Router (TypeScript)
- Docker Compose (`web` + `web-e2e-tests` services)
- Playwright smoke test

**Next:** Follow [step-1/prompts.md](step-1/prompts.md) to add AWS infrastructure (Terraform), CI/CD (GitHub Actions), and production Docker builds.

### [step-2](step-2/) — Next.js on ECS Express Mode

The Next.js app with Terraform IaC for deploying to AWS ECS Express Mode, plus CI/CD via GitHub Actions. Frontend only — no backend or database.

**What's added from step-1:**
- Terraform IaC (persistent: VPC, ECR, IAM; ephemeral: ECS Express Gateway)
- GitHub Actions workflows (E2E tests, image build/push, IaC plan/apply)
- Production Dockerfile for web
- OIDC setup and cloud deployment documentation

**Next:** Follow [step-2/prompts.md](step-2/prompts.md) to add a minimal NestJS backend with health check and Git SHA display.

### [step-3](step-3/) — Next.js + NestJS (health check) on ECS Express Mode

Next.js frontend and a minimal NestJS backend (health check with GIT_SHA and Swagger), both deployed to AWS ECS Express Mode.

**What's added from step-2:**
- NestJS 11 backend with `GET /health` endpoint (returns Git SHA)
- Swagger UI at `/api` (non-production)
- Backend Dockerfile, ECR repository, security group, and ECS Express Gateway service
- Web app fetches and displays backend Git SHA
- Backend service in Docker Compose

**Next:** Follow [step-3/prompts.md](step-3/prompts.md) to add PostgreSQL, Prisma ORM, and Items CRUD.

### [step-4](step-4/) — Next.js + NestJS with Items CRUD on ECS Express Mode

Next.js frontend and a NestJS backend with health check and Items CRUD (PostgreSQL + Prisma), deployed to AWS ECS Express Mode.

**What's added from step-3:**
- PostgreSQL 17 database
- Prisma ORM with Item model
- Items CRUD API (`POST /items`, `GET /items`, `DELETE /items/:id`) — no authentication
- Web app with items list, create form, and delete buttons
- Items E2E test
- RDS PostgreSQL, private subnets, and NAT gateway in Terraform
- Secrets Manager for DATABASE_URL

**Next:** Follow [step-4/prompts.md](step-4/prompts.md) to add email/password authentication (JWT) with user-scoped items.

### [step-5](step-5/) — Next.js + NestJS with Auth + Items CRUD on ECS Express Mode

Next.js frontend and a NestJS backend with email/password authentication (JWT) and user-scoped Items CRUD (PostgreSQL + Prisma), deployed to AWS ECS Express Mode.

**What's added from step-4:**
- Email/password sign-up and sign-in with JWT tokens
- User model in Prisma (user-scoped items)
- JWT auth guard on items endpoints (ownership check)
- Sign-in and sign-up pages with AuthContext
- Dashboard (user profile) and authenticated items page
- Navigation header (Dashboard, Items, Sign out)
- Secrets Manager for JWT secrets and DATABASE_URL in Terraform

**Next:** Follow [step-5/prompts.md](step-5/prompts.md) to add OAuth2, email verification, TOTP MFA, and internationalization.

### [step-final](step-final/) — Full-Stack App

The complete application with all features — OAuth2 authentication, email verification, TOTP MFA, internationalization, and more.

**What's added from step-5:**
- OAuth2 authentication (Apple, Discord, GitHub, Google, X/Twitter)
- Email verification and password reset flows
- TOTP MFA (two-factor authentication) with recovery codes
- SMTP email integration (Mailpit for local dev)
- Internationalization (English + Japanese)
- Account linking/unlinking for OAuth providers
- Settings page (email, MFA, linked accounts, theme)
- Full E2E test suites for backend and web

## Infrastructure Layer Design: Persistent vs. Ephemeral

In this workshop, the Terraform code is divided into two distinct layers: **Persistent (default)** and **Ephemeral**.

The primary goals of this architecture are to minimize cloud costs during learning and to maintain a clean, reproducible experimental environment that can be built and destroyed as many times as needed.

### Persistent Layer

**Key Resources:** VPC (network infrastructure), ECR (container registry), IAM Roles, Security Groups, etc.

**Characteristics:** These resources rarely change once created and incur little to no ongoing holding costs. They serve as the "foundation" and are meant to be kept throughout the duration of the workshop.

### Ephemeral Layer

**Key Resources:** ECS (Fargate container execution environment), ALB (Load Balancer), RDS (`db.t4g.micro` PostgreSQL).

**Characteristics:** This layer consolidates resources that incur continuous hourly billing while running. By using `terraform apply` only when you are actively working, and `terraform destroy` on this layer when you finish for the day, you can significantly reduce idle costs.

### Why is the Database (RDS) also disposable?

In a typical production environment, databases are placed in the persistent layer to protect data. However, for this workshop, we intentionally include the database in the Ephemeral layer.

- **Absolute Cost Control:** Although we use a highly cost-effective `db.t4g.micro` instance, leaving it running 24/7 still incurs charges. Grouping it with compute resources ensures that you never forget to turn it off, preventing unexpected bills.
- **Starting with a Clean Slate:** Developing AI agents often requires frequent schema changes and recreating test data as you tweak prompts and logic. By destroying and recreating the entire environment, you avoid bugs caused by leftover data or schema inconsistencies, allowing you to always resume development in a clean state dictated exactly by your Infrastructure as Code (IaC).

> **Warning:** Destroying the ephemeral layer will permanently delete all data within the DB. This is an intentional design choice for this workshop to embrace the concept of a "Disposable Environment."

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
