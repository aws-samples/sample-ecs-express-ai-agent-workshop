# Production Dockerfile for the NestJS backend
# suitable for Cloud Run or any container-hosted environment.

# --- dependencies stage ----------------------------------------------------
# Installs all dependencies (including dev) and generates Prisma client.
# Used as the base for both the runtime builder and the db-push job.
FROM node:24-bookworm-slim AS deps

# openssl is required by Prisma to detect the correct engine binary
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# enable corepack so pnpm is available
RUN corepack enable && corepack prepare pnpm@latest --activate \
    && npm install -g npm-check-updates sort-package-json

WORKDIR /usr/src/app

# copy lockfile and package manifests first to take advantage of Docker cache
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.json nest-cli.json ./

# install all dependencies (including devtools) so we can build
RUN pnpm install --frozen-lockfile

# copy the rest of the backend sources
COPY . ./

# generate prisma client and compile typescript
RUN pnpm prisma:generate

# --- db-push stage (Cloud Run Job for schema sync) -------------------------
# Lightweight image with Prisma CLI to run `prisma db push` against Cloud SQL.
# Build with: docker build --target db-push ...
FROM node:24-bookworm-slim AS db-push

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/prisma ./prisma
COPY --from=deps /usr/src/app/prisma.config.ts ./
COPY --from=deps /usr/src/app/tsconfig.json ./
COPY --from=deps /usr/src/app/package.json ./
COPY --from=deps /usr/src/app/scripts ./scripts

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node ./scripts/apply-session-table.mjs"]

# --- db-migrate stage (Cloud Run Job for production migrations) ------------
# Runs `prisma migrate deploy` to apply pending migrations.
# Build with: docker build --target db-migrate ...
FROM node:24-bookworm-slim AS db-migrate

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/prisma ./prisma
COPY --from=deps /usr/src/app/prisma.config.ts ./
COPY --from=deps /usr/src/app/tsconfig.json ./
COPY --from=deps /usr/src/app/package.json ./
COPY --from=deps /usr/src/app/scripts ./scripts

CMD ["sh", "-c", "npx prisma migrate deploy && node ./scripts/apply-session-table.mjs"]

# --- build stage -----------------------------------------------------------
FROM deps AS builder

RUN pnpm build

# remove dev dependencies to shrink the image (pnpm prune does this)
RUN pnpm prune --prod

# --- runtime stage ---------------------------------------------------------
FROM gcr.io/distroless/nodejs24-debian12:nonroot AS runner

WORKDIR /usr/src/app

# copy over only what we need from the builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

# Git SHA for version identification (pass via --build-arg GIT_SHA=...)
ARG GIT_SHA=undefined
ENV GIT_SHA=$GIT_SHA

# default port; Cloud Run will override via PORT env var
ENV PORT=4000
EXPOSE 4000

# nest build outputs to dist/src/ because prisma.config.ts at the project root
# causes TypeScript to infer rootDir as "." instead of "./src".
CMD ["dist/src/main"]
