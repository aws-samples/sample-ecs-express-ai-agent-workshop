# Git SHA Display

Every client displays the current Git short SHA as a small, semi-transparent overlay in the bottom-right corner of every screen (visible without sign-in, non-interactive). The SHA is resolved at build time.

## Per-Platform Injection

| Platform | Mechanism | Key file(s) |
|----------|-----------|-------------|
| **Backend** | `GIT_SHA` env var (Dockerfile `ARG`/`ENV` in production). `GET /health` returns `{ status, gitSha }`. | `backend/src/app.service.ts` |
| **Web** | `next.config.js` runs `execSync('git rev-parse --short HEAD')` → `NEXT_PUBLIC_GIT_SHA` baked into static export. | `web/app/next.config.js`, `web/app/app/layout.tsx` |

## Production / CI Builds

For Docker builds where `.git` is excluded from the context, pass SHA as a build arg:

```sh
docker build --build-arg GIT_SHA=$(git rev-parse --short HEAD) -f Dockerfiles.d/backend-build/Dockerfile backend/
```

On CI:
```yaml
--build-arg GIT_SHA=$(echo ${{ github.sha }} | cut -c1-7)
```

## Fallback Values

| Platform | Fallback |
|----------|----------|
| Backend | HTTP 503 unhealthy |
| Web | `"unknown"` |

## Combined Display

Each client fetches `GET /health` and compares SHAs: `f/b: 028ff47` (same), `f: 028ff47, b: 028ff48` (different), or frontend SHA only (backend unreachable).
