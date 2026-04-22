const { execSync } = require('child_process')

const gitSHA = process.env.NEXT_PUBLIC_GIT_SHA || (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
})()

/** @type {import('next').NextConfig} */
module.exports = {
  env: {
    NEXT_PUBLIC_GIT_SHA: gitSHA,
  },
  reactStrictMode: true,
  // Allow the Playwright container (web-e2e-tests) to reach the dev server
  // via the Docker service name "web".
  allowedDevOrigins: ['web'],
  // Static export-friendly; suitable for SPA static hosting
  output: 'export',
  // Proxy API requests through the dev server so both browsers (host) and
  // Playwright containers (Docker internal network) can reach the backend.
  // BACKEND_URL is a server-side env var set in compose.yaml; it never
  // reaches the browser bundle.
  // Note: rewrites() is only active in dev mode (next dev). It has no effect
  // on the static export produced by next build.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4000'
    return [
      {
        source: '/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ]
  },
}
