# Production Dockerfile for the NestJS backend

# --- build stage -----------------------------------------------------------
FROM node:24-bookworm-slim AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

COPY pnpm-lock.yaml package.json ./
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

RUN pnpm install --frozen-lockfile

COPY . ./

RUN pnpm build && pnpm prune --prod

# --- runtime stage ---------------------------------------------------------
FROM gcr.io/distroless/nodejs24-debian12:nonroot AS runner

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

ARG GIT_SHA=undefined
ENV GIT_SHA=$GIT_SHA

ENV PORT=4000
EXPOSE 4000

CMD ["dist/main"]
