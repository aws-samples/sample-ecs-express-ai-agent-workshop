# Prompts to grow step-3 into step-4

Use the following prompts in order with the AI agent to add PostgreSQL, Prisma ORM, and Items CRUD to the existing Next.js + NestJS project.

## 1. Add PostgreSQL to Docker Compose

Could you add a `db` service to `compose.yaml` using `postgres:17-alpine` with database name `app`, user `postgres`, password `password`, a healthcheck, and a named volume for data persistence? Make the `backend` service depend on `db` being healthy.

## 2. Add secrets env file for DATABASE_URL

Could you create `.example.secrets.env` and `.secrets.env` with `DATABASE_URL=postgresql://postgres:password@db:5432/app` and `TF_VAR_database_password=change-me-database-password`? Add `.secrets.env` to the backend's `env_file` in `compose.yaml`.

## 3. Add Prisma ORM v7 to the backend

Could you add `@prisma/client@^7`, `@prisma/adapter-pg@^7`, and `pg` as dependencies, and `prisma@^7` as a devDependency to the backend `package.json`? Also add `class-validator` and `class-transformer` for DTO validation. Add `postinstall`, `prisma:generate`, and `prisma:push` scripts. Create a `prisma.config.mjs` using `defineConfig` from `prisma/config` that configures the schema directory as `prisma/` and reads `DATABASE_URL` from the environment.

## 4. Create the Prisma schema for Item model

Could you create a multi-file Prisma schema under `backend/prisma/`? The `schema.prisma` should configure the `prisma-client` generator (Prisma v7 uses `prisma-client`, not `prisma-client-js`) with output to `../src/generated/prisma` and PostgreSQL datasource. Create `item.prisma` with an `Item` model that has `id` (cuid), `name` (String), `createdAt`, and `updatedAt` fields.

## 5. Create the Prisma service and module

Could you create `backend/src/prisma/prisma.service.ts` that wraps `PrismaClient` with the `@prisma/adapter-pg` PostgreSQL adapter, exposes the `item` model, and implements `OnModuleInit`/`OnModuleDestroy`? Also create `backend/src/prisma/prisma.module.ts` as a global module that exports `PrismaService`.

## 6. Create the Items module

Could you create a NestJS Items module under `backend/src/items/` with:
- `items.module.ts` — declares controller and service
- `items.controller.ts` — `POST /items` (create), `GET /items` (list all), `DELETE /items/:id` (delete by id), with Swagger decorators
- `items.service.ts` — CRUD operations using PrismaService
- `dto/create-item.dto.ts` — validates `name` field (IsString, IsNotEmpty) with Swagger decorator
- `entities/item.entity.ts` — response entity with Swagger decorators

No authentication required — items are not scoped to users.

## 7. Register the Items module and add validation

Could you update `backend/src/app.module.ts` to import `PrismaModule` and `ItemsModule`? And update `backend/src/main.ts` to add a global `ValidationPipe` with `transform: true` and `whitelist: true`?

## 8. Update the backend compose command for Prisma

Could you update the `backend` command in `compose.yaml` to run `pnpm exec prisma generate` and `pnpm exec prisma db push --accept-data-loss` before `pnpm dev`?

## 9. Update the web app to show items CRUD

Could you update `web/app/app/page.tsx` to add an Items section below the Git SHA display? It should fetch `GET /backend/items` on load, have a form to create items via `POST /backend/items`, and a delete button per item via `DELETE /backend/items/:id`. Handle non-ok responses gracefully.

## 10. Add items E2E test

Could you create `web/e2e-tests/tests/items.spec.ts` that tests creating an item, verifying it appears in the list, then deleting it and verifying it's removed?

## 11. Add Secrets Manager for DATABASE_URL in persistent IaC

Could you create `iac/aws/secrets-manager.tf` with a Secrets Manager secret for `DATABASE_URL`, plus an IAM policy granting the ECS execution role `secretsmanager:GetSecretValue` access? Add a `secret_database_url_arn` output to `iac/aws/outputs.tf`.

## 12. Add RDS, private subnets, and NAT gateway to IaC

Could you add private subnets (2 AZs), a private route table, and an RDS security group (port 5432, ingress from backend SG) to `iac/aws/vpc-network.tf`? Add the corresponding outputs to `iac/aws/outputs.tf`.

Could you create `iac/aws/ephemeral/rds.tf` with an RDS PostgreSQL 17 instance (`db.t4g.micro`) in the private subnets? And `iac/aws/ephemeral/vpc.tf` with a NAT gateway for the private subnets to access ECR? Add `database_password`, `database_name`, and `database_user` variables.

## 13. Store DATABASE_URL in Secrets Manager from ephemeral IaC

Could you create `iac/aws/ephemeral/secret-versions.tf` that auto-populates the `DATABASE_URL` secret from the RDS endpoint? Update the backend ECS service in `ecs-express-backend.tf` to use a `secret` block for `DATABASE_URL` (referencing the Secrets Manager ARN from the persistent layer) instead of a plain `environment` block.

## 14. Update IaC workflows for database password

Could you add `TF_VAR_database_password` (from secrets) to the ephemeral IaC workflow environment variables?
