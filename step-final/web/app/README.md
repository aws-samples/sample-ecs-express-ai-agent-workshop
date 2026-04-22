# web/app — Next.js SPA

Quick start (standalone, without Docker):

```sh
cd web/app
pnpm install
pnpm dev
```

- Dev server: `http://localhost:3000`
- The dev server proxies `/backend/*` to `http://localhost:4000` (backend must be running)

When running via Docker Compose, use `docker compose up` from the repo root — no manual install needed.
