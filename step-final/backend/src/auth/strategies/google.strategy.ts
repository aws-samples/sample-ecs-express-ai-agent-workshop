import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string | null;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.AUTH_GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: `${process.env.AUTH_CALLBACK_BASE_URL ?? 'http://localhost:4000'}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<GoogleProfile> {
    return {
      googleId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      name: profile.displayName ?? null,
    };
  }
}
