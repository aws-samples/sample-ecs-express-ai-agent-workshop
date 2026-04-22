# Local Development

## 1. Set up environment variables

```sh
cp .example.secrets.env .secrets.env
```

Edit `.secrets.env` and replace placeholders. See [.example.secrets.env](../.example.secrets.env) for all variables.

**Linux only** — set UID/GID so bind-mounted files are owned by your user:

```sh
test $(uname -s) = 'Linux' && {
  echo "GID=$(id -g)"
  echo "UID=$(id -u)"
} >> .secrets.env || :
```

Run `docker compose build` after changing UID/GID.

**JWT secrets:** `openssl rand -base64 32`

### OAuth2 Provider Setup

**Apple Sign In** — [Apple Developer Account](https://developer.apple.com/account/):
1. Register an App ID with Sign in with Apple enabled
2. Create a Services ID (`APPLE_CLIENT_ID`)
3. Add return URLs: `http://localhost:4000/auth/apple/callback` and `.../native/callback`
4. Create a Sign in with Apple key, download `.p8`
5. Copy Team ID, Key ID, Services ID, and `.p8` contents into `.secrets.env` (replace newlines with `\n`)

**Discord** — [Developer Portal](https://discord.com/developers/applications):
1. Create application → OAuth2 → add redirects: `http://localhost:4000/auth/discord/callback` and `.../native/callback`
2. Copy Client ID and Client Secret into `.secrets.env`

**GitHub** — [Developer Settings](https://github.com/settings/developers) (use **OAuth Apps**, not GitHub Apps):
1. New OAuth App → callback URL: `http://localhost:4000/auth/github/callback`
2. Copy Client ID + Client Secret into `.secrets.env`
3. For native apps, register a second OAuth App with `.../native/callback`

> Uses `read:user` scope. Users without public email get `github_{id}@github.invalid`.

**Google** — [Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials:
1. Create OAuth 2.0 Client ID (Web application)
2. Add redirect URIs: `http://localhost:4000/auth/google/callback` and `.../native/callback`
3. Copy Client ID + Client Secret into `.secrets.env`

**X (Twitter)** — [Developer Portal](https://developer.twitter.com/):
1. App Settings → OAuth 2.0 → Type: Web App
2. Add callback URIs: `http://localhost:4000/auth/twitter/callback` and `.../native/callback`
3. Copy Client ID + Client Secret into `.secrets.env`

## 2. Start the backend and web

```sh
docker compose up
```

Containers auto-upgrade dependencies, apply DB schema, and start in watch mode.

| URL | Description |
|-----|-------------|
| http://localhost:4000 | Backend API |
| http://localhost:4000/api | Swagger UI |
| http://localhost:3000 | Web |

## 3. Run E2E tests

### Web (Playwright)

```sh
docker compose --profile=e2e-tests run --rm web-e2e-tests
docker compose --profile=e2e-tests down --remove-orphans
```

