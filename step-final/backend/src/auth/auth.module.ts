import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AppleNativeStrategy } from './strategies/apple-native.strategy';
import { AppleStrategy } from './strategies/apple.strategy';
import { GithubNativeStrategy } from './strategies/github-native.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { GoogleNativeStrategy } from './strategies/google-native.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TwitterNativeStrategy } from './strategies/twitter-native.strategy';
import { TwitterStrategy } from './strategies/twitter.strategy';
import { DiscordNativeStrategy } from './strategies/discord-native.strategy';
import { DiscordStrategy } from './strategies/discord.strategy';

@Module({
  imports: [PrismaModule, MailModule, UsersModule, PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AppleStrategy, AppleNativeStrategy, GithubStrategy, GithubNativeStrategy, GoogleStrategy, GoogleNativeStrategy, TwitterStrategy, TwitterNativeStrategy, DiscordStrategy, DiscordNativeStrategy],
})
export class AuthModule {}
