import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { GithubProfile } from './github.strategy';

@Injectable()
export class GithubNativeStrategy extends PassportStrategy(Strategy, 'github-native') {
  constructor() {
    super({
      clientID: process.env.AUTH_GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET ?? '',
      callbackURL: `${process.env.AUTH_NATIVE_CALLBACK_BASE_URL ?? 'http://localhost:4000'}/auth/github/native/callback`,
      scope: ['read:user'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<GithubProfile> {
    return {
      githubId: profile.id,
      email: profile.emails?.[0]?.value ?? null,
      name: profile.displayName ?? null,
    };
  }
}
