// Set environment variables BEFORE any NestJS module imports.
// These must be set before the PrismaService constructor runs and
// before Passport strategies read their config from process.env.
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:password@localhost:5432/localauth';
process.env.AUTH_JWT_SECRET = 'test-jwt-secret';
process.env.AUTH_JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.AUTH_JWT_ACCESS_EXPIRATION = '15m';
process.env.AUTH_JWT_REFRESH_EXPIRATION = '7d';
process.env.AUTH_SESSION_SECRET = 'test-session-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.NATIVE_APP_URL_SCHEME = 'oauth2app';

// Dummy values for OAuth strategies so their constructors don't throw
// during NestJS module initialization.
process.env.AUTH_APPLE_CLIENT_ID = process.env.AUTH_APPLE_CLIENT_ID ?? 'test-apple-client-id';
process.env.AUTH_APPLE_TEAM_ID = process.env.AUTH_APPLE_TEAM_ID ?? 'test-apple-team-id';
process.env.AUTH_APPLE_KEY_ID = process.env.AUTH_APPLE_KEY_ID ?? 'test-apple-key-id';
process.env.AUTH_APPLE_PRIVATE_KEY = process.env.AUTH_APPLE_PRIVATE_KEY ?? 'test-apple-private-key';
process.env.AUTH_CALLBACK_BASE_URL =
  process.env.AUTH_CALLBACK_BASE_URL ?? 'http://localhost:4000';
process.env.AUTH_NATIVE_CALLBACK_BASE_URL =
  process.env.AUTH_NATIVE_CALLBACK_BASE_URL ?? 'http://localhost:4000';
process.env.AUTH_GOOGLE_CLIENT_ID = process.env.AUTH_GOOGLE_CLIENT_ID ?? 'test-google-client-id';
process.env.AUTH_GOOGLE_CLIENT_SECRET = process.env.AUTH_GOOGLE_CLIENT_SECRET ?? 'test-google-client-secret';
process.env.AUTH_GITHUB_CLIENT_ID = process.env.AUTH_GITHUB_CLIENT_ID ?? 'test-github-client-id';
process.env.AUTH_GITHUB_CLIENT_SECRET = process.env.AUTH_GITHUB_CLIENT_SECRET ?? 'test-github-client-secret';
process.env.AUTH_TWITTER_CLIENT_ID = process.env.AUTH_TWITTER_CLIENT_ID ?? 'test-twitter-client-id';
process.env.AUTH_TWITTER_CLIENT_SECRET =
  process.env.AUTH_TWITTER_CLIENT_SECRET ?? 'test-twitter-client-secret';
