import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import { I18nContext } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UsersService, UserRecord, UserWithSocial, SOCIAL_INCLUDES, OAuthProvider, OAuthProviders } from '../users/users.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { AppleProfile } from './strategies/apple.strategy';
import { GoogleProfile } from './strategies/google.strategy';
import { TwitterProfile } from './strategies/twitter.strategy';
import { GithubProfile } from './strategies/github.strategy';
import { DiscordProfile } from './strategies/discord.strategy';

type OAuthProfile = AppleProfile | DiscordProfile | GithubProfile | GoogleProfile | TwitterProfile;

/** Maps provider name to the profile's provider-specific ID field and fallback email domain. */
const PROVIDER_CONFIG: Record<OAuthProvider, { idKey: string; emailDomain: string }> = {
  [OAuthProviders.Apple]:   { idKey: 'appleId',   emailDomain: 'apple.invalid' },
  [OAuthProviders.Discord]: { idKey: 'discordId', emailDomain: 'discord.invalid' },
  [OAuthProviders.GitHub]:  { idKey: 'githubId',  emailDomain: 'github.invalid' },
  [OAuthProviders.Google]:  { idKey: 'googleId',  emailDomain: '' },
  [OAuthProviders.Twitter]: { idKey: 'twitterId', emailDomain: 'x.invalid' },
};

function getProviderId(provider: OAuthProvider, profile: OAuthProfile): string {
  return (profile as any)[PROVIDER_CONFIG[provider].idKey];
}

function getProfileEmail(profile: OAuthProfile): string | null {
  return profile.email ?? null;
}

function getFallbackEmail(provider: OAuthProvider, providerId: string): string | null {
  const domain = PROVIDER_CONFIG[provider].emailDomain;
  return domain ? `${provider}_${providerId}@${domain}` : null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {}

  private t(key: string, args?: Record<string, unknown>): string {
    const i18n = I18nContext.current();
    return i18n ? i18n.t(key, { args }) : key;
  }

  async signUp(dto: SignUpDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(this.t('auth.EMAIL_ALREADY_IN_USE'));
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const token = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const requireVerification = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === 'true';

    await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        emailVerified: !requireVerification,
        emailVerificationToken: requireVerification ? token : null,
        emailVerificationExpires: requireVerification ? expires : null,
      },
    });

    if (requireVerification) {
      await this.mailService.sendVerificationEmail(dto.email, token);
      return { message: this.t('auth.VERIFICATION_EMAIL_SENT'), requiresVerification: true };
    }

    return { message: this.t('auth.SIGNUP_SUCCESS'), requiresVerification: false };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException(this.t('auth.INVALID_VERIFICATION_TOKEN'));
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      throw new BadRequestException(this.t('auth.VERIFICATION_TOKEN_EXPIRED'));
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return { message: this.t('auth.EMAIL_VERIFIED') };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.emailVerified) {
      // Return success even if user not found to prevent email enumeration
      return { message: this.t('auth.RESEND_VERIFICATION_SUCCESS') };
    }

    const token = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      },
    });

    await this.mailService.sendVerificationEmail(email, token);

    return { message: 'If the email is registered and unverified, a verification email has been sent' };
  }

  async signIn(dto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(this.t('auth.INVALID_CREDENTIALS'));
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException(this.t('auth.INVALID_CREDENTIALS'));
    }

    const requireVerification = process.env.AUTH_REQUIRE_EMAIL_VERIFICATION === 'true';
    if (requireVerification && !user.emailVerified) {
      throw new UnauthorizedException(this.t('auth.EMAIL_NOT_VERIFIED'));
    }

    if (user.totpEnabled) {
      const mfaToken = this.jwtService.sign(
        { sub: user.id, purpose: 'mfa' },
        {
          secret: process.env.AUTH_JWT_SECRET ?? 'change-me',
          expiresIn: '5m',
        },
      );
      return { requiresMfa: true as const, mfaToken };
    }

    return this.buildTokenResponse(user);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.AUTH_JWT_REFRESH_SECRET ?? 'change-me-refresh',
      });
    } catch {
      throw new UnauthorizedException(this.t('auth.INVALID_REFRESH_TOKEN'));
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException(this.t('auth.INVALID_REFRESH_TOKEN'));
    }

    return this.buildTokenResponse(user);
  }

  async findOrCreateSocialUser(provider: OAuthProvider, profile: OAuthProfile) {
    const providerId = getProviderId(provider, profile);
    const profileEmail = getProfileEmail(profile);

    // 1. Look up by providerId (most stable identifier)
    const social = await this.prisma.socialAccount.findUnique({
      where: { provider_providerId: { provider, providerId } },
      include: { user: true },
    });
    if (social) {
      return this.buildTokenResponse(social.user);
    }

    // 2. Fall back to email lookup, and link to existing account
    if (profileEmail) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profileEmail },
      });
      if (existingUser) {
        await this.prisma.socialAccount.create({
          data: { provider, providerId, email: profileEmail, userId: existingUser.id },
        });
        return this.buildTokenResponse(existingUser);
      }
    }

    // 3. Create new user with linked social account
    const email = profileEmail ?? getFallbackEmail(provider, providerId)!;
    const user = await this.prisma.user.create({
      data: {
        email,
        name: profile.name,
        passwordHash: null,
        emailVerified: !email.endsWith('.invalid'),
        socialAccounts: { create: { provider, providerId, email: profileEmail } },
      },
    });

    return this.buildTokenResponse(user);
  }

  async verifyAppleToken(
    identityToken: string,
    fullName?: { givenName?: string; familyName?: string },
  ) {
    // Decode the Apple identity token JWT (without signature verification for stub)
    const decoded = this.jwtService.decode(identityToken) as {
      sub?: string;
      email?: string;
    } | null;

    if (!decoded?.sub) {
      throw new UnauthorizedException(this.t('auth.INVALID_APPLE_TOKEN'));
    }

    const name = [fullName?.givenName, fullName?.familyName]
      .filter(Boolean)
      .join(' ')
      .trim() || null;

    const profile: AppleProfile = {
      appleId: decoded.sub,
      email: decoded.email ?? null,
      name,
    };

    return this.findOrCreateSocialUser(OAuthProviders.Apple, profile);
  }

  async updateEmail(userId: string, newEmail: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictException(this.t('auth.EMAIL_ALREADY_IN_USE'));
    }

    const token = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailVerified: false,
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      },
      include: SOCIAL_INCLUDES,
    });

    await this.mailService.sendVerificationEmail(newEmail, token);

    const { passwordHash, emailVerificationToken, emailVerificationExpires, totpSecret: _ts, recoveryCodes: _rc, socialAccounts, ...result } = user;
    return {
      ...result,
      ...this.usersService.socialToFlat(user),
      hasPassword: passwordHash != null,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.emailVerified) {
      // Return success even if user not found to prevent email enumeration
      return { message: this.t('auth.FORGOT_PASSWORD_SUCCESS') };
    }

    const token = randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    await this.mailService.sendPasswordResetEmail(email, token);

    return { message: 'If the email is registered and verified, a password reset email has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user) {
      throw new BadRequestException(this.t('auth.INVALID_PASSWORD_RESET_TOKEN'));
    }

    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      throw new BadRequestException(this.t('auth.PASSWORD_RESET_TOKEN_EXPIRED'));
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: this.t('auth.PASSWORD_RESET_SUCCESS') };
  }

  // --- Account linking ---

  async linkSocial(provider: OAuthProvider, userId: string, profile: OAuthProfile) {
    const providerId = getProviderId(provider, profile);
    const profileEmail = getProfileEmail(profile);

    const existing = await this.prisma.socialAccount.findUnique({
      where: { provider_providerId: { provider, providerId } },
    });
    if (existing && existing.userId !== userId) {
      throw new ConflictException(this.t('auth.SOCIAL_ALREADY_LINKED', { provider }));
    }
    await this.prisma.socialAccount.upsert({
      where: { provider_userId: { provider, userId } },
      create: { provider, providerId, email: profileEmail, userId },
      update: { providerId, email: profileEmail },
    });
  }

  // --- Account deletion ---

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    await this.prisma.user.delete({ where: { id: userId } });
  }

  // --- Account unlinking ---

  async unlinkSocial(provider: OAuthProvider, userId: string) {
    await this.ensureAlternativeAuthExists(userId, provider);
    await this.prisma.socialAccount.deleteMany({ where: { provider, userId } });
  }

  private async ensureAlternativeAuthExists(userId: string, excludeProvider: OAuthProvider) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: SOCIAL_INCLUDES,
    });
    if (!user) throw new UnauthorizedException();
    const hasOtherSocial = user.socialAccounts.some(a => a.provider !== excludeProvider);
    if (!user.passwordHash && !hasOtherSocial) {
      throw new ConflictException(this.t('auth.CANNOT_UNLINK_ONLY_AUTH'));
    }
  }

  private async buildTokenResponse(user: UserRecord) {
    const payload = { sub: user.id, email: user.email };

    // expiresIn is typed as StringValue | number in @types/jsonwebtoken,
    // but env vars are plain string. Cast via unknown to satisfy the type.
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.AUTH_JWT_SECRET ?? 'change-me',
      expiresIn: (process.env.AUTH_JWT_ACCESS_EXPIRATION ?? '15m') as unknown as number,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.AUTH_JWT_REFRESH_SECRET ?? 'change-me-refresh',
      expiresIn: (process.env.AUTH_JWT_REFRESH_EXPIRATION ?? '7d') as unknown as number,
    });

    // Query social accounts for flat response
    const userWithSocial = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: SOCIAL_INCLUDES,
    });

    const { passwordHash: _pw, emailVerificationToken: _evt, emailVerificationExpires: _eve, passwordResetToken: _prt, passwordResetExpires: _pre, totpSecret: _ts, recoveryCodes: _rc, socialAccounts, ...userWithoutPassword } = userWithSocial!;

    return {
      accessToken,
      refreshToken,
      user: {
        ...userWithoutPassword,
        ...this.usersService.socialToFlat(userWithSocial as UserWithSocial),
      },
    };
  }

  // --- TOTP MFA ---

  async totpSetup(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.totpEnabled) throw new ConflictException(this.t('auth.TOTP_ALREADY_ENABLED'));

    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: process.env.APP_NAME ?? 'OAuth2App',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret.base32 },
    });

    return {
      secret: secret.base32,
      uri: totp.toString(),
    };
  }

  async totpEnable(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) throw new BadRequestException(this.t('auth.TOTP_NOT_SET_UP'));
    if (user.totpEnabled) throw new ConflictException(this.t('auth.TOTP_ALREADY_ENABLED'));

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) throw new BadRequestException(this.t('auth.INVALID_TOTP_CODE'));

    const recoveryCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex'),
    );
    const hashedCodes = await Promise.all(
      recoveryCodes.map((c) => bcrypt.hash(c, 10)),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpEnabled: true,
        recoveryCodes: hashedCodes,
      },
    });

    return { recoveryCodes };
  }

  async totpDisable(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpEnabled || !user.totpSecret)
      throw new BadRequestException(this.t('auth.TOTP_NOT_ENABLED'));

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) throw new BadRequestException(this.t('auth.INVALID_TOTP_CODE'));

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null, recoveryCodes: null },
    });

    return { message: this.t('auth.TOTP_DISABLED') };
  }

  async totpVerify(mfaToken: string, code: string) {
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwtService.verify(mfaToken, {
        secret: process.env.AUTH_JWT_SECRET ?? 'change-me',
      });
    } catch {
      throw new UnauthorizedException(this.t('auth.INVALID_EXPIRED_MFA_TOKEN'));
    }
    if (payload.purpose !== 'mfa') {
      throw new UnauthorizedException(this.t('auth.INVALID_MFA_TOKEN'));
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.totpEnabled || !user.totpSecret) {
      throw new UnauthorizedException(this.t('auth.INVALID_MFA_TOKEN'));
    }

    // Try TOTP code first
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: code, window: 1 });

    if (delta !== null) {
      return this.buildTokenResponse(user);
    }

    // Try recovery code
    if (user.recoveryCodes && Array.isArray(user.recoveryCodes)) {
      const hashes = user.recoveryCodes as string[];
      for (let i = 0; i < hashes.length; i++) {
        if (await bcrypt.compare(code, hashes[i])) {
          const remaining = [...hashes];
          remaining.splice(i, 1);
          await this.prisma.user.update({
            where: { id: user.id },
            data: { recoveryCodes: remaining },
          });
          return this.buildTokenResponse(user);
        }
      }
    }

    throw new UnauthorizedException(this.t('auth.INVALID_TOTP_OR_RECOVERY'));
  }

  async totpRegenerateRecoveryCodes(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpEnabled || !user.totpSecret)
      throw new BadRequestException(this.t('auth.TOTP_NOT_ENABLED'));

    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.totpSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) throw new BadRequestException(this.t('auth.INVALID_TOTP_CODE'));

    const recoveryCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex'),
    );
    const hashedCodes = await Promise.all(
      recoveryCodes.map((c) => bcrypt.hash(c, 10)),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { recoveryCodes: hashedCodes },
    });

    return { recoveryCodes };
  }
}
