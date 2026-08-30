import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors';
import { AuthUser } from '../common/types/auth-user';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async follow(user: AuthUser, targetId: string) {
    if (user.id === targetId) {
      throw new ApiException('INVALID_FOLLOW', 'You cannot follow yourself.', HttpStatus.BAD_REQUEST);
    }
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target || target.status !== 'ACTIVE') {
      throw new ApiException('USER_NOT_FOUND', 'User not found.', HttpStatus.NOT_FOUND);
    }
    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: targetId },
          { blockerId: targetId, blockedId: user.id },
        ],
      },
    });
    if (blocked) {
      throw new ApiException('BLOCKED', 'You cannot follow this user.', HttpStatus.FORBIDDEN);
    }
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId: user.id, followingId: targetId } },
      create: { followerId: user.id, followingId: targetId },
      update: {},
    });
    await this.notifications.create({
      userId: targetId,
      actorId: user.id,
      type: 'FOLLOW',
      referenceId: user.id,
    });
    return { following: true };
  }

  async unfollow(user: AuthUser, targetId: string) {
    await this.prisma.follow.deleteMany({
      where: { followerId: user.id, followingId: targetId },
    });
    return { following: false };
  }

  async followers(username: string, cursor?: string, limit = 20) {
    const user = await this.requireUser(username);
    const rows = await this.prisma.follow.findMany({
      where: { followingId: user.id, ...(cursor ? { followerId: { lt: cursor } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        follower: { select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true } },
      },
    });
    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: slice.map((r) => r.follower),
      nextCursor: hasMore ? slice[slice.length - 1].followerId : null,
    };
  }

  async following(username: string, cursor?: string, limit = 20) {
    const user = await this.requireUser(username);
    const rows = await this.prisma.follow.findMany({
      where: { followerId: user.id, ...(cursor ? { followingId: { lt: cursor } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        following: { select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true } },
      },
    });
    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    return {
      items: slice.map((r) => r.following),
      nextCursor: hasMore ? slice[slice.length - 1].followingId : null,
    };
  }

  private async requireUser(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (!user) throw new ApiException('USER_NOT_FOUND', 'User not found.', HttpStatus.NOT_FOUND);
    return user;
  }
}
