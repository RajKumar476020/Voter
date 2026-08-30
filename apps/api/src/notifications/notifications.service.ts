import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: {
    userId: string;
    actorId: string | null;
    type: NotificationType;
    referenceId?: string | null;
  }) {
    if (input.actorId && input.actorId === input.userId) return;
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        actorId: input.actorId,
        type: input.type,
        referenceId: input.referenceId ?? null,
      },
    });
  }

  async list(userId: string, cursor?: string, limit = 20) {
    const items = await this.prisma.notification.findMany({
      where: { userId, ...(cursor ? { id: { lt: cursor } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        actor: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });
    const hasMore = items.length > limit;
    const slice = hasMore ? items.slice(0, limit) : items;
    const unreadCount = await this.prisma.notification.count({ where: { userId, read: false } });
    return {
      items: slice,
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
      unreadCount,
    };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return { ok: true };
  }
}
