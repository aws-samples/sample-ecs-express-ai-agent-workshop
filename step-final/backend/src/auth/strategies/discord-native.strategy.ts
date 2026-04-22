import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-discord';
import { DiscordProfile } from './discord.strategy';

@Injectable()
export class DiscordNativeStrategy extends PassportStrategy(Strategy, 'discord-native') {
  constructor() {
    super({
      clientID: process.env.AUTH_DISCORD_CLIENT_ID ?? '',
      clientSecret: process.env.AUTH_DISCORD_CLIENT_SECRET ?? '',
      callbackURL: `${process.env.AUTH_NATIVE_CALLBACK_BASE_URL ?? 'http://localhost:4000'}/auth/discord/native/callback`,
      scope: ['identify', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<DiscordProfile> {
    return {
      discordId: profile.id,
      email: profile.email ?? null,
      name: profile.username ?? null,
    };
  }
}
