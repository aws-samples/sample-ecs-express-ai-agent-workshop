export const OAuthProviders = {
  Apple: 'Apple',
  Discord: 'Discord',
  GitHub: 'GitHub',
  Google: 'Google',
  Twitter: 'Twitter',
} as const;
export type OAuthProvider = (typeof OAuthProviders)[keyof typeof OAuthProviders];
