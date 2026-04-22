import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { GoogleProfile } from './google.strategy';

@Injectable()
export class GoogleNativeStrategy extends PassportStrategy(Strategy, 'google-native') {
  constructor() {
    super({
      clientID: process.env.AUTH_GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: `${process.env.AUTH_NATIVE_CALLBACK_BASE_URL ?? 'http://localhost:4000'}/auth/google/native/callback`,
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
