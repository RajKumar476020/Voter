import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { hashToken } from '../crypto';
import { ApiException } from '../errors';
import { SESSION_COOKIE } from '../../auth/session.constants';
import { AuthUser } from '../types/auth-user';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = await resolveSessionUser(this.prisma, request);
    if (!user) {
      throw new ApiException('UNAUTHENTICATED', 'Please sign in to continue.', HttpStatus.UNAUTHORIZED);
    }
    if (user.status === 'BANNED' || user.status === 'SUSPENDED' || user.status === 'DELETED') {
      throw new ApiException('ACCOUNT_RESTRICTED', 'This account cannot access the platform.', HttpStatus.FORBIDDEN);
    }
    request.user = user;
    return true;
  }
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = await resolveSessionUser(this.prisma, request);
    if (user && user.status === 'ACTIVE') {
      request.user = user;
    }
    return true;
  }
}

export async function resolveSessionUser(prisma: PrismaService, request: Request): Promise<AuthUser | null> {
  const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  return session.user;
}
