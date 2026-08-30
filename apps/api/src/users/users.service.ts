import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthUser } from '../common/types/auth-user';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async byUsername(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        status: true,
        _count: { select: { polls: true, followers: true, following: true } },
      },
    });
    if (!user || user.status === 'DELETED') {
      throw new ApiException('USER_NOT_FOUND', 'User not found.', HttpStatus.NOT_FOUND);
    }
    const votesReceived = await this.prisma.poll.aggregate({
      where: { userId: user.id, status: { in: ['ACTIVE', 'EXPIRED'] } },
      _sum: { voteCount: true },
    });
    let isFollowing = false;
    let isBlocked = false;
    if (viewerId) {
      const [follow, block] = await Promise.all([
        this.prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
        }),
        this.prisma.block.findUnique({
          where: { blockerId_blockedId: { blockerId: viewerId, blockedId: user.id } },
        }),
      ]);
      isFollowing = Boolean(follow);
      isBlocked = Boolean(block);
    }
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
      pollCount: user._count.polls,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      votesReceived: votesReceived._sum.voteCount ?? 0,
      isFollowing,
      isBlocked,
      isSelf: viewerId === user.id,
    };
  }

  async updateMe(user: AuthUser, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: dto.displayName?.trim(),
        bio: dto.bio?.trim(),
        avatarUrl: dto.avatarUrl,
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async block(user: AuthUser, targetId: string) {
    if (user.id === targetId) {
      throw new ApiException('INVALID_BLOCK', 'You cannot block yourself.', HttpStatus.BAD_REQUEST);
    }
    await this.prisma.$transaction([
      this.prisma.block.upsert({
        where: { blockerId_blockedId: { blockerId: user.id, blockedId: targetId } },
        create: { blockerId: user.id, blockedId: targetId },
        update: {},
      }),
      this.prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: user.id, followingId: targetId },
            { followerId: targetId, followingId: user.id },
          ],
        },
      }),
    ]);
    return { blocked: true };
  }

  async unblock(user: AuthUser, targetId: string) {
    await this.prisma.block.deleteMany({
      where: { blockerId: user.id, blockedId: targetId },
    });
    return { blocked: false };
  }
}
