# Production Dockerfile for the Next.js web client (static export)
# suitable for Cloud Run or any container-hosted environment.
#
# Three stages:
#   1. web-builder  — Node.js: pnpm build → static export (out/)
#   2. server-builder — Go: compile a tiny static file server + reverse proxy
#   3. runner       — Google Distroless: just the binary + static files

# --- web build stage -------------------------------------------------------
FROM node:24-bookworm-slim AS web-builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

COPY . ./

ARG GIT_SHA=unknown
ENV NEXT_PUBLIC_GIT_SHA=$GIT_SHA

RUN pnpm build

# --- server build stage ----------------------------------------------------
# Wolfi-based image; includes Bash, make, and gcc for building Go binaries
FROM cgr.dev/chainguard/go:latest AS server-builder

WORKDIR /src

RUN go mod init server

# write the static file server source inline (standard library only)
RUN cat <<'GOEOF' > main.go
package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	port := env("PORT", "3000")
	backendURL := env("BACKEND_URL", "http://localhost:4000")
	staticDir := env("STATIC_DIR", "/usr/share/html")

	backend, err := url.Parse(backendURL)
	if err != nil {
		log.Fatalf("invalid BACKEND_URL: %v", err)
	}

	mux := http.NewServeMux()

	// reverse proxy: /backend/* → backend service (strip prefix)
	proxy := httputil.NewSingleHostReverseProxy(backend)
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.URL.Path = strings.TrimPrefix(req.URL.Path, "/backend")
		if req.URL.Path == "" {
			req.URL.Path = "/"
		}
		req.Host = backend.Host
	}
	mux.Handle("/backend/", proxy)

	// static files with SPA fallback
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		clean := filepath.Clean(r.URL.Path)
		path := filepath.Join(staticDir, clean)
		if info, err := os.Stat(path); err == nil && !info.IsDir() {
			http.ServeFile(w, r, path)
			return
		}
		// Try adding .html extension (Next.js static export generates e.g. signup.html)
		htmlPath := filepath.Join(staticDir, clean+".html")
		if info, err := os.Stat(htmlPath); err == nil && !info.IsDir() {
			http.ServeFile(w, r, htmlPath)
			return
		}
		http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
	})

	log.Printf("listening on :%s (backend: %s)", port, backendURL)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
GOEOF

RUN CGO_ENABLED=0 go build -ldflags='-s -w' -o /server main.go

# --- runtime stage ---------------------------------------------------------
FROM gcr.io/distroless/static-debian12:nonroot AS runner

COPY --from=web-builder /usr/src/app/out /usr/share/html
COPY --from=server-builder /server /server

ENV PORT=3000
ENV BACKEND_URL=http://localhost:4000
EXPOSE 3000

ENTRYPOINT ["/server"]
