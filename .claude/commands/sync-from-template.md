Sync all relevant changes from the template repo into each step.

Template repo: https://github.com/mazgi/template-containerized-oauth2-project (main branch)

## Procedure

### 1. Fetch template files

Fetch the following from the template repo's `main` branch via raw.githubusercontent.com:

**Dockerfiles:**
- `Dockerfiles.d/web/Dockerfile`
- `Dockerfiles.d/web-e2e-tests/Dockerfile`
- `Dockerfiles.d/backend/Dockerfile`
- `Dockerfiles.d/iac/Dockerfile`
- `Dockerfiles.d/backend-build/Dockerfile`
- `Dockerfiles.d/web-build/Dockerfile`

**Compose & env:**
- `compose.yaml`
- `.example.env`
- `.example.secrets.env`
- `.dockerignore`
- `.gitignore`

**Config files:**
- `backend/tsconfig.json`
- `backend/tsconfig.build.json`
- `backend/nest-cli.json`
- `backend/package.json`
- `backend/prisma/schema.prisma`
- `backend/prisma.config.ts`
- `backend/src/app.controller.ts`
- `backend/src/app.service.ts`
- `web/app/package.json`
- `web/app/next.config.js`
- `web/app/tsconfig.json`
- `web/e2e-tests/package.json`
- `web/e2e-tests/playwright.config.ts`

**CI workflows:**
- `.github/workflows/backend.build.yaml`
- `.github/workflows/web.build.yaml`
- `.github/workflows/backend.e2e-tests.yaml`
- `.github/workflows/web.e2e-tests.yaml`
- `.github/workflows/iac.yaml`
- `.github/workflows/iac.ephemeral.yaml`
- `.github/workflows/_reusable-backend-build.yaml`
- `.github/workflows/_reusable-web-build.yaml`
- `.github/workflows/_reusable-iac.yaml`

**Docs:**
- `docs/local-development.md`
- `docs/ci.md`
- `docs/git-sha-display.md`
- `docs/oidc-setup.md`
- `docs/secrets.md`

### 2. Compare with step-final

Compare each template file with the corresponding file in `step-final/` to identify differences.

### 3. Apply changes to each step

Apply changes to all steps that have the corresponding file. File-to-step mapping:

| File type | Steps |
|-----------|-------|
| `Dockerfiles.d/web/` | 1–5, final |
| `Dockerfiles.d/web-e2e-tests/` | 1–5, final |
| `Dockerfiles.d/backend/` | 3–5, final |
| `Dockerfiles.d/iac/` | 2–5, final |
| `Dockerfiles.d/backend-build/` | 2–5, final |
| `Dockerfiles.d/web-build/` | 2–5, final |
| `compose.yaml` | 1–5, final |
| `.example.env` | 1–5, final |
| `.example.secrets.env` | 4–5, final |
| `.dockerignore` | 2–5, final |
| `.gitignore` | 1–5, final |
| `backend/tsconfig.json` | 3–5, final |
| `backend/package.json` | 3–5, final (version ranges only) |
| `web/app/package.json` | 1–5, final (version ranges and overrides only) |
| `web/e2e-tests/package.json` | 1–5, final (version ranges only) |
| `web/e2e-tests/playwright.config.ts` | 1–5, final |
| CI workflows | final only |
| Docs | final only |
| `step-0/prompts.md` and `prompts.ja.md` | step-0 only |

### 4. Verify

Show `git diff --stat` summary for review.

## Important

- This is an ECS workshop repo. **Skip** Azure/GCP-specific additions (volume mounts, TF_VAR env vars, multi-cloud provider matrices, .gitignore entries for apple/android).
- Do NOT add new services, env vars, or features that don't already exist in each step.
- Each step is progressive — preserve each step's scope. Only sync structural, config, and version changes.
- For `compose.yaml`: update command patterns (e.g., exec, git SHA ordering) but preserve each step's service set and environment variables.
- For `package.json`: sync version ranges and pnpm overrides, but do not add/remove dependencies that differ between the workshop and template (workshop intentionally removed some features).
- For CI workflows: sync action version bumps (e.g., `@v5` → `@v6`) but do not add Azure/GCP conditional blocks.
