# Production Dockerfile for the NestJS backend (with Prisma)

# --- dependencies stage ----------------------------------------------------
FROM node:24-bookworm-slim AS deps

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

COPY pnpm-lock.yaml package.json ./
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

RUN pnpm install --frozen-lockfile

COPY . ./

RUN pnpm prisma:generate

# --- build stage -----------------------------------------------------------
FROM deps AS builder

RUN pnpm build && CI=true pnpm prune --prod

# --- runtime stage ---------------------------------------------------------
FROM gcr.io/distroless/nodejs24-debian12:nonroot AS runner

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

ARG GIT_SHA=undefined
ENV GIT_SHA=$GIT_SHA

ENV PORT=4000
EXPOSE 4000

CMD ["dist/src/main"]
