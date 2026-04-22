# Prompts to grow step-2 into step-3

Use the following prompts in order with the AI agent to add a minimal NestJS backend (health check with Git SHA) to the existing Next.js + AWS IaC project.

## 1. Create a minimal NestJS backend

Could you create a NestJS backend under `backend/` with only a health check endpoint? It should:
- `GET /health` returns `{ "status": "ok", "gitSha": "<GIT_SHA>" }` (from the `GIT_SHA` environment variable)
- Return HTTP 503 if `GIT_SHA` is not set
- Include Swagger UI at `/api` (non-production only)
- Use minimal dependencies (no database, no auth, no mail)
- Include `nest-cli.json`, `tsconfig.json`, `tsconfig.build.json`, and `package.json`

## 2. Add Dockerfiles for backend (development and production)

Could you create a production Dockerfile at `Dockerfiles.d/backend-build/Dockerfile` that builds the NestJS backend as a multi-stage build? It should use `node:24-bookworm-slim` for building and `gcr.io/distroless/nodejs24-debian12:nonroot` for runtime, accept a `GIT_SHA` build arg, run `nest build`, prune dev dependencies, and produce a minimal final image that runs `dist/main` on port 4000.

## 3. Add a Dockerfile for backend development

Could you create a Dockerfile at `Dockerfiles.d/backend/Dockerfile` for local development? It should be based on `node:24-bookworm-slim` with git, pnpm (via corepack), npm-check-updates, and sort-package-json installed. Match the pattern of `Dockerfiles.d/web/Dockerfile`.

## 4. Add the backend service to compose.yaml

Could you add a `backend` service to `compose.yaml` that:
- Uses `Dockerfiles.d/backend/Dockerfile`
- Sets `GIT_SHA` from `git rev-parse --short HEAD` at container startup
- Runs `pnpm install && pnpm dev`
- Exposes port 4000 with a healthcheck
- Make the `web` service depend on `backend` (healthy) and pass `BACKEND_URL=http://backend:4000`
- Update `web-e2e-tests` to also receive `BACKEND_URL=http://backend:4000`

## 5. Update the Next.js app to display the backend Git SHA

Could you update `web/app/next.config.ts` to add a rewrite rule proxying `/backend/*` to `BACKEND_URL`? Then update `web/app/app/page.tsx` to fetch `GET /backend/health` and display the backend's Git SHA on the homepage.

## 6. Update E2E tests for the backend integration

Could you update `web/e2e-tests/tests/smoke.spec.ts` to verify the homepage shows the backend Git SHA (not stuck on "loading...")?

## 7. Add backend ECR repository to persistent IaC

Could you add an `aws_ecr_repository` for the backend image in `iac/aws/ecr.tf` and add an `ecr_backend_repository_url` output in `iac/aws/outputs.tf`?

## 8. Add backend security group to persistent IaC

Could you add an `aws_security_group` for ECS backend tasks (port 4000) in `iac/aws/vpc-network.tf` and add an `sg_ecs_backend_id` output in `iac/aws/outputs.tf`?

## 9. Add backend ECS Express Gateway service to ephemeral IaC

Could you create `iac/aws/ephemeral/ecs-express-backend.tf` with an `aws_ecs_express_gateway_service` for the backend (port 4000, health check at `/health`, 256 CPU, 512 MiB memory, auto-scaling 1-2 tasks)? Also add `backend_url` variable and output, and update `remote-state.tf` locals.

## 10. Update IaC workflow environment variables

Could you update `.github/workflows/iac.ephemeral.yaml` to pass `TF_VAR_backend_url` and update `compose.yaml` iac service to pass `TF_VAR_backend_url`?

## 11. Update .env with backend URL variable

Could you add `BACKEND_URL` to `.env` and `.example.env` alongside `FRONTEND_URL` in the Terraform variables section?
