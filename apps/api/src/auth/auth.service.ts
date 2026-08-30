import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors';
import { hashToken, randomToken } from '../common/crypto';
import { SESSION_COOKIE, SESSION_DAYS } from './session.constants';
import { ForgotPasswordDto, LoginDto, ResetPasswordDto, SignupDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignupDto, res: Response) {
    const username = dto.username.toLowerCase();
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      throw new ApiException('ACCOUNT_EXISTS', 'That username or email is already in use.', HttpStatus.CONFLICT);
    }
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        displayName: dto.displayName?.trim() || dto.username,
      },
    });
    await this.issueSession(user.id, res);
    return this.publicUser(user.id);
  }

  async login(dto: LoginDto, res: Response) {
    const identifier = dto.identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });
    if (!user) {
      throw new ApiException('INVALID_CREDENTIALS', 'Email or password is incorrect.', HttpStatus.UNAUTHORIZED);
    }
    if (user.status === 'BANNED' || user.status === 'DELETED') {
      throw new ApiException('ACCOUNT_RESTRICTED', 'This account cannot sign in.', HttpStatus.FORBIDDEN);
    }
    if (user.status === 'SUSPENDED') {
      throw new ApiException('ACCOUNT_SUSPENDED', 'This account is temporarily suspended.', HttpStatus.FORBIDDEN);
    }
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) {
      throw new ApiException('INVALID_CREDENTIALS', 'Email or password is incorrect.', HttpStatus.UNAUTHORIZED);
    }
    await this.issueSession(user.id, res);
    return this.publicUser(user.id);
  }

  async logout(token: string | undefined, res: Response) {
    if (token) {
      await this.prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
    }
    res.clearCookie(SESSION_COOKIE, this.cookieOptions());
    return { ok: true };
  }

  async me(userId: string) {
    return this.publicUser(userId);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (user) {
      const token = randomToken();
      await this.prisma.passwordReset.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 1000 * 60 * 30),
        },
      });
      if (this.config.get('NODE_ENV') !== 'production') {
        this.logger.log(`Password reset token for ${user.email}: ${token}`);
        return { sent: true, devToken: token };
      }
    }
    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: hashToken(dto.token) },
    });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      throw new ApiException('INVALID_TOKEN', 'This reset link is invalid or expired.', HttpStatus.BAD_REQUEST);
    }
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      this.prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      this.prisma.session.deleteMany({ where: { userId: reset.userId } }),
    ]);
    return { ok: true };
  }

  private async issueSession(userId: string, res: Response) {
    const token = randomToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.session.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    });
    res.cookie(SESSION_COOKIE, token, {
      ...this.cookieOptions(),
      expires: expiresAt,
    });
  }

  private cookieOptions() {
    const isProd = this.config.get('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };
  }

  private async publicUser(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    return user;
  }
}
