import { Injectable } from '@nestjs/common';
import { PollStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { pollInclude, PollsService } from '../polls/polls.service';

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly polls: PollsService,
  ) {}

  async home(tab: string, viewerId?: string, cursor?: string, limit = 20, category?: string) {
    switch (tab) {
      case 'following':
        return this.following(viewerId, cursor, limit);
      case 'trending':
        return this.trending(viewerId, cursor, limit, category);
      case 'latest':
        return this.latest(viewerId, cursor, limit, category);
      default:
        return this.forYou(viewerId, cursor, limit);
    }
  }

  async explore(sort: string, viewerId?: string, cursor?: string, limit = 20, category?: string) {
    if (sort === 'ending') return this.endingSoon(viewerId, cursor, limit, category);
    if (sort === 'discussed') return this.mostDiscussed(viewerId, cursor, limit, category);
    if (sort === 'popular') return this.trending(viewerId, cursor, limit, category);
    if (sort === 'latest') return this.latest(viewerId, cursor, limit, category);
    return this.trending(viewerId, cursor, limit, category);
  }

  private visibleWhere(category?: string): Prisma.PollWhereInput {
    return {
      status: { in: [PollStatus.ACTIVE, PollStatus.EXPIRED] },
      ...(category ? { category: { slug: category } } : {}),
    };
  }

  private async latest(viewerId?: string, cursor?: string, limit = 20, category?: string) {
    const polls = await this.prisma.poll.findMany({
      where: {
        ...this.visibleWhere(category),
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: pollInclude,
    });
    return this.page(polls, limit, viewerId);
  }

  private async following(viewerId?: string, cursor?: string, limit = 20) {
    if (!viewerId) return { items: [], nextCursor: null };
    const follows = await this.prisma.follow.findMany({
      where: { followerId: viewerId },
      select: { followingId: true },
    });
    const ids = follows.map((f) => f.followingId);
    if (!ids.length) return { items: [], nextCursor: null };
    const polls = await this.prisma.poll.findMany({
      where: {
        userId: { in: ids },
        ...this.visibleWhere(),
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: pollInclude,
    });
    return this.page(polls, limit, viewerId);
  }

  private async trending(viewerId?: string, cursor?: string, limit = 20, category?: string) {
    const polls = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM polls
      WHERE status IN ('ACTIVE', 'EXPIRED')
      ${category ? Prisma.sql`AND category_id IN (SELECT id FROM categories WHERE slug = ${category})` : Prisma.empty}
      ORDER BY
        (
          (vote_count * 3 + comment_count * 4 + like_count * 2 + share_count * 2)
          / POWER(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600.0 + 2, 1.5)
        ) DESC,
        created_at DESC
      LIMIT ${limit + 1}
      OFFSET ${cursor ? Number.parseInt(cursor, 10) || 0 : 0}
    `;
    const offset = cursor ? Number.parseInt(cursor, 10) || 0 : 0;
    const ids = polls.map((p) => p.id);
    const records = await this.prisma.poll.findMany({
      where: { id: { in: ids } },
      include: pollInclude,
    });
    const ordered = ids.map((id) => records.find((p) => p.id === id)!).filter(Boolean);
    const hasMore = ordered.length > limit;
    const slice = hasMore ? ordered.slice(0, limit) : ordered;
    const items = await Promise.all(slice.map((poll) => this.polls.withViewerState(poll, viewerId)));
    return { items, nextCursor: hasMore ? String(offset + limit) : null };
  }

  private async mostDiscussed(viewerId?: string, cursor?: string, limit = 20, category?: string) {
    const polls = await this.prisma.poll.findMany({
      where: this.visibleWhere(category),
      orderBy: [{ commentCount: 'desc' }, { createdAt: 'desc' }],
      take: limit + 1,
      skip: cursor ? Number.parseInt(cursor, 10) || 0 : 0,
      include: pollInclude,
    });
    const offset = cursor ? Number.parseInt(cursor, 10) || 0 : 0;
    const hasMore = polls.length > limit;
    const slice = hasMore ? polls.slice(0, limit) : polls;
    const items = await Promise.all(slice.map((poll) => this.polls.withViewerState(poll, viewerId)));
    return { items, nextCursor: hasMore ? String(offset + limit) : null };
  }

  private async endingSoon(viewerId?: string, cursor?: string, limit = 20, category?: string) {
    const polls = await this.prisma.poll.findMany({
      where: {
        ...this.visibleWhere(category),
        status: PollStatus.ACTIVE,
        expiresAt: { not: null, gt: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
      take: limit + 1,
      skip: cursor ? Number.parseInt(cursor, 10) || 0 : 0,
      include: pollInclude,
    });
    const offset = cursor ? Number.parseInt(cursor, 10) || 0 : 0;
    const hasMore = polls.length > limit;
    const slice = hasMore ? polls.slice(0, limit) : polls;
    const items = await Promise.all(slice.map((poll) => this.polls.withViewerState(poll, viewerId)));
    return { items, nextCursor: hasMore ? String(offset + limit) : null };
  }

  private async forYou(viewerId?: string, cursor?: string, limit = 20) {
    if (!viewerId) return this.trending(undefined, cursor, limit);
    const [categories, follows] = await Promise.all([
      this.prisma.userCategory.findMany({ where: { userId: viewerId } }),
      this.prisma.follow.findMany({ where: { followerId: viewerId }, select: { followingId: true } }),
    ]);
    const categoryIds = categories.map((c) => c.categoryId);
    const followIds = follows.map((f) => f.followingId);
    const polls = await this.prisma.poll.findMany({
      where: {
        status: { in: [PollStatus.ACTIVE, PollStatus.EXPIRED] },
        OR: [
          followIds.length ? { userId: { in: followIds } } : undefined,
          categoryIds.length ? { categoryId: { in: categoryIds } } : undefined,
          { voteCount: { gte: 3 } },
        ].filter(Boolean) as Prisma.PollWhereInput[],
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: pollInclude,
    });
    return this.page(polls, limit, viewerId);
  }

  private async page(
    polls: Prisma.PollGetPayload<{ include: typeof pollInclude }>[],
    limit: number,
    viewerId?: string,
  ) {
    const hasMore = polls.length > limit;
    const slice = hasMore ? polls.slice(0, limit) : polls;
    const items = await Promise.all(slice.map((poll) => this.polls.withViewerState(poll, viewerId)));
    return { items, nextCursor: hasMore ? slice[slice.length - 1].id : null };
  }
}
