# Prompts to grow step-0 into step-1

Use the following prompts in order with the AI agent to create an empty Next.js App Router project with Docker Compose and Playwright E2E tests from scratch.

## 1. Create a Dockerfile for Next.js development

Could you create `Dockerfiles.d/web/Dockerfile` based on `node:24-bookworm-slim` with git, pnpm (via corepack), npm-check-updates, and sort-package-json installed? Create a non-root `developer` user matching the host UID/GID.

## 2. Create environment and git configuration

Could you create `.env` and `.example.env` with container UID/GID settings (Docker Engine only, not Docker Desktop), and a `.gitignore` that ignores `*.env` (except `.example.*`), `node_modules/`, `.pnpm-store/`, `.next/`, `.DS_Store`, and `.vscode/`?

## 3. Create a Docker Compose file

Could you create `compose.yaml` with a `web` service that builds from `Dockerfiles.d/web/Dockerfile`, runs `pnpm install && pnpm dev`, exposes port 3000, and bind-mounts the project directory?

## 4. Create a Next.js App Router project

Could you create an empty Next.js App Router project under `web/app/` using `create-next-app` with TypeScript, ESLint, pnpm, and no Tailwind? Node.js is not installed on the host, so run it via `docker compose run`.

## 5. Create a Dockerfile for Playwright E2E tests

Could you create `Dockerfiles.d/web-e2e-tests/Dockerfile` based on `mcr.microsoft.com/playwright:v1.59.1` with pnpm (via corepack), npm-check-updates, and sort-package-json installed? Create a non-root `developer` user matching the host UID/GID.

## 6. Set up Playwright E2E tests

Could you create `web/e2e-tests/` with a `playwright.config.ts` (Chromium, baseURL from `BASE_URL` env var), `package.json` with `@playwright/test` pinned to `1.59.1` (matching the Docker image version), and a smoke test that verifies the homepage loads?

## 7. Add web-e2e-tests service to Docker Compose

Could you add a `web-e2e-tests` service to `compose.yaml` that depends on the `web` service being healthy (add a healthcheck to `web`), runs under the `e2e-tests` profile, and executes `pnpm install && pnpm test`?

## 8. Verify the setup

Could you run `docker compose --profile=e2e-tests run --rm web-e2e-tests` to verify the E2E tests pass?
