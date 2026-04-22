import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from '@superfaceai/passport-twitter-oauth2';
import { TwitterProfile } from './twitter.strategy';

@Injectable()
export class TwitterNativeStrategy extends PassportStrategy(Strategy, 'twitter-native') {
  constructor() {
    super({
      clientID: process.env.AUTH_TWITTER_CLIENT_ID ?? '',
      clientSecret: process.env.AUTH_TWITTER_CLIENT_SECRET ?? '',
      callbackURL: `${process.env.AUTH_NATIVE_CALLBACK_BASE_URL ?? 'http://localhost:4000'}/auth/twitter/native/callback`,
      clientType: 'confidential',
      scope: ['tweet.read', 'users.read', 'offline.access'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile: any,
  ): Promise<TwitterProfile> {
    return {
      twitterId: profile.id as string,
      email: (profile.emails?.[0]?.value as string) ?? null,
      name: (profile.displayName as string) ?? null,
    };
  }
}
