import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(dto: SignUpDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
      },
    });

    return this.buildTokenResponse(user);
  }

  async signIn(dto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
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
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.buildTokenResponse(user);
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    await this.prisma.user.delete({ where: { id: userId } });
  }

  private async buildTokenResponse(user: { id: string; email: string; name: string | null; createdAt: Date; updatedAt: Date }) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.AUTH_JWT_SECRET ?? 'change-me',
      expiresIn: (process.env.AUTH_JWT_ACCESS_EXPIRATION ?? '15m') as unknown as number,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.AUTH_JWT_REFRESH_SECRET ?? 'change-me-refresh',
      expiresIn: (process.env.AUTH_JWT_REFRESH_EXPIRATION ?? '7d') as unknown as number,
    });

    const { passwordHash: _pw, ...userWithoutPassword } = await this.prisma.user.findUnique({
      where: { id: user.id },
    }) as any;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }
}
