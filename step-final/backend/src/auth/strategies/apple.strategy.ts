import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AppleStrategyBase = require('passport-apple');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jwt = require('jsonwebtoken');

export type AppleProfile = {
  appleId: string;
  email: string | null;
  name: string | null;
};

@Injectable()
export class AppleStrategy extends PassportStrategy(
  AppleStrategyBase,
  'apple',
  true,
) {
  constructor() {
    super({
      clientID: process.env.AUTH_APPLE_CLIENT_ID ?? '',
      teamID: process.env.AUTH_APPLE_TEAM_ID ?? '',
      keyID: process.env.AUTH_APPLE_KEY_ID ?? '',
      privateKeyString: (process.env.AUTH_APPLE_PRIVATE_KEY ?? '').replace(
        /\\n/g,
        '\n',
      ),
      callbackURL: `${process.env.AUTH_CALLBACK_BASE_URL ?? 'http://localhost:4000'}/auth/apple/callback`,
      passReqToCallback: true,
      scope: ['name', 'email'],
    });
  }

  async validate(
    req: any,
    _accessToken: string,
    _refreshToken: string,
    idTokenRaw: string,
    _profile: any,
  ): Promise<AppleProfile> {
    // passport-apple passes the raw id_token JWT as params;
    // decode it to extract sub, email, etc.
    const idToken = jwt.decode(idTokenRaw) as Record<string, any> | null;
    const sub: string = idToken?.sub ?? '';

    // Apple only sends name on the first authorization via req.body.user
    let firstName: string | undefined;
    let lastName: string | undefined;
    if (req.body?.user) {
      try {
        const userData =
          typeof req.body.user === 'string'
            ? JSON.parse(req.body.user)
            : req.body.user;
        firstName = userData?.name?.firstName;
        lastName = userData?.name?.lastName;
      } catch {
        // ignore parse errors
      }
    }

    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || null;

    return {
      appleId: sub,
      email: idToken?.email ?? null,
      name,
    };
  }
}
