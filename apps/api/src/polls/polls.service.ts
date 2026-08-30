import { HttpStatus, Injectable } from '@nestjs/common';
import { PollStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePollDto, UpdatePollDto } from './dto/poll.dto';
import { ApiException } from '../common/errors';
import { isExpired, serializePoll } from './poll.serializer';
import { slugify } from '../common/crypto';
import { AuthUser } from '../common/types/auth-user';
import { NotificationsService } from '../notifications/notifications.service';

const DURATION_HOURS: Record<string, number | null> = {
  none: null,
  '1h': 1,
  '6h': 6,
  '12h': 12,
  '1d': 24,
  '3d': 72,
  '7d': 168,
  '30d': 720,
};

@Injectable()
export class PollsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(user: AuthUser, dto: CreatePollDto) {
    const recent = await this.prisma.poll.count({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent >= 10) {
      throw new ApiException('RATE_LIMITED', 'You can create up to 10 polls per hour.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const expiresAt = resolveExpiry(dto.duration, dto.expiresAt);
    const tags = await this.upsertTags(dto.tags ?? []);

    const poll = await this.prisma.poll.create({
      data: {
        userId: user.id,
        question: dto.question.trim(),
        description: dto.description?.trim() || null,
        imageUrl: dto.imageUrl || null,
        pollType: dto.pollType ?? 'SINGLE',
        categoryId: dto.categoryId || null,
        allowComments: dto.allowComments ?? true,
        anonymousVoting: dto.anonymousVoting ?? false,
        expiresAt,
        options: {
          create: dto.options.map((option, index) => ({
            text: option.text.trim(),
            imageUrl: option.imageUrl || null,
            position: index,
          })),
        },
        tags: {
          create: tags.map((tag) => ({ tagId: tag.id })),
        },
      },
      include: pollInclude,
    });
    return serializePoll(poll);
  }

  async findOne(id: string, viewerId?: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id },
      include: pollInclude,
    });
    if (!poll || poll.status === PollStatus.DELETED || poll.status === PollStatus.REMOVED) {
      throw new ApiException('POLL_NOT_FOUND', 'This poll is unavailable.', HttpStatus.NOT_FOUND);
    }
    return this.withViewerState(poll, viewerId);
  }

  async update(id: string, user: AuthUser, dto: UpdatePollDto) {
    const poll = await this.requireOwned(id, user);
    if (poll.voteCount > 0 && dto.question) {
      throw new ApiException('POLL_LOCKED', 'Question cannot change after votes are cast.', HttpStatus.CONFLICT);
    }
    const updated = await this.prisma.poll.update({
      where: { id },
      data: {
        question: dto.question?.trim(),
        description: dto.description?.trim(),
        allowComments: dto.allowComments,
      },
      include: pollInclude,
    });
    return this.withViewerState(updated, user.id);
  }

  async remove(id: string, user: AuthUser) {
    await this.requireOwned(id, user);
    await this.prisma.poll.update({
      where: { id },
      data: { status: PollStatus.DELETED },
    });
    return { ok: true };
  }

  async like(id: string, user: AuthUser) {
    const poll = await this.requireVisible(id);
    try {
      await this.prisma.$transaction([
        this.prisma.pollLike.create({ data: { userId: user.id, pollId: id } }),
        this.prisma.poll.update({ where: { id }, data: { likeCount: { increment: 1 } } }),
      ]);
    } catch {
      return { liked: true };
    }
    if (poll.userId !== user.id) {
      await this.notifications.create({
        userId: poll.userId,
        actorId: user.id,
        type: 'POLL_LIKE',
        referenceId: id,
      });
    }
    return { liked: true };
  }

  async unlike(id: string, user: AuthUser) {
    const deleted = await this.prisma.pollLike.deleteMany({ where: { userId: user.id, pollId: id } });
    if (deleted.count) {
      await this.prisma.poll.update({ where: { id }, data: { likeCount: { decrement: 1 } } });
    }
    return { liked: false };
  }

  async save(id: string, user: AuthUser) {
    await this.requireVisible(id);
    await this.prisma.savedPoll.upsert({
      where: { userId_pollId: { userId: user.id, pollId: id } },
      create: { userId: user.id, pollId: id },
      update: {},
    });
    return { saved: true };
  }

  async unsave(id: string, user: AuthUser) {
    await this.prisma.savedPoll.deleteMany({ where: { userId: user.id, pollId: id } });
    return { saved: false };
  }

  async share(id: string) {
    await this.requireVisible(id);
    await this.prisma.poll.update({ where: { id }, data: { shareCount: { increment: 1 } } });
    return { ok: true };
  }

  async listByUser(username: string, cursor?: string, limit = 20, viewerId?: string) {
    const user = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (!user) throw new ApiException('USER_NOT_FOUND', 'User not found.', HttpStatus.NOT_FOUND);
    const polls = await this.prisma.poll.findMany({
      where: {
        userId: user.id,
        status: { in: [PollStatus.ACTIVE, PollStatus.EXPIRED] },
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: pollInclude,
    });
    return this.page(polls, limit, viewerId);
  }

  async saved(userId: string, cursor?: string, limit = 20) {
    const rows = await this.prisma.savedPoll.findMany({
      where: { userId, ...(cursor ? { pollId: { lt: cursor } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: { poll: { include: pollInclude } },
    });
    const items = rows.map((r) => r.poll);
    const hasMore = items.length > limit;
    const slice = hasMore ? items.slice(0, limit) : items;
    const serialized = await Promise.all(slice.map((poll) => this.withViewerState(poll, userId)));
    return { items: serialized, nextCursor: hasMore ? slice[slice.length - 1].id : null };
  }

  async likedByUser(username: string, cursor?: string, limit = 20, viewerId?: string) {
    const user = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (!user) throw new ApiException('USER_NOT_FOUND', 'User not found.', HttpStatus.NOT_FOUND);
    const rows = await this.prisma.pollLike.findMany({
      where: { userId: user.id, ...(cursor ? { pollId: { lt: cursor } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: { poll: { include: pollInclude } },
    });
    const items = rows.map((r) => r.poll).filter((p) => p.status === 'ACTIVE' || p.status === 'EXPIRED');
    const hasMore = rows.length > limit;
    const slice = items.slice(0, limit);
    const serialized = await Promise.all(slice.map((poll) => this.withViewerState(poll, viewerId)));
    return { items: serialized, nextCursor: hasMore ? slice[slice.length - 1]?.id ?? null : null };
  }

  async votedByUser(username: string, cursor?: string, limit = 20, viewerId?: string) {
    const user = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (!user) throw new ApiException('USER_NOT_FOUND', 'User not found.', HttpStatus.NOT_FOUND);
    const rows = await this.prisma.voteSubmission.findMany({
      where: { userId: user.id, ...(cursor ? { pollId: { lt: cursor } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: { poll: { include: pollInclude } },
    });
    const items = rows.map((r) => r.poll);
    const hasMore = items.length > limit;
    const slice = hasMore ? items.slice(0, limit) : items;
    const serialized = await Promise.all(slice.map((poll) => this.withViewerState(poll, viewerId)));
    return { items: serialized, nextCursor: hasMore ? slice[slice.length - 1].id : null };
  }

  async withViewerState(poll: Prisma.PollGetPayload<{ include: typeof pollInclude }>, viewerId?: string) {
    if (!viewerId) return serializePoll(poll);
    const [like, saved, submission, follow] = await Promise.all([
      this.prisma.pollLike.findUnique({ where: { userId_pollId: { userId: viewerId, pollId: poll.id } } }),
      this.prisma.savedPoll.findUnique({ where: { userId_pollId: { userId: viewerId, pollId: poll.id } } }),
      this.prisma.voteSubmission.findUnique({
        where: { userId_pollId: { userId: viewerId, pollId: poll.id } },
        include: { choices: true },
      }),
      this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: poll.userId } },
      }),
    ]);
    return serializePoll(poll, {
      liked: Boolean(like),
      saved: Boolean(saved),
      hasVoted: Boolean(submission),
      myOptionIds: submission?.choices.map((c) => c.optionId) ?? [],
      followingAuthor: Boolean(follow),
    });
  }

  private async page(polls: Prisma.PollGetPayload<{ include: typeof pollInclude }>[], limit: number, viewerId?: string) {
    const hasMore = polls.length > limit;
    const slice = hasMore ? polls.slice(0, limit) : polls;
    const items = await Promise.all(slice.map((poll) => this.withViewerState(poll, viewerId)));
    return { items, nextCursor: hasMore ? slice[slice.length - 1].id : null };
  }

  private async requireOwned(id: string, user: AuthUser) {
    const poll = await this.prisma.poll.findUnique({ where: { id } });
    if (!poll || poll.status === 'DELETED') {
      throw new ApiException('POLL_NOT_FOUND', 'This poll is unavailable.', HttpStatus.NOT_FOUND);
    }
    if (poll.userId !== user.id && user.role === 'USER') {
      throw new ApiException('FORBIDDEN', 'You cannot edit this poll.', HttpStatus.FORBIDDEN);
    }
    return poll;
  }

  private async requireVisible(id: string) {
    const poll = await this.prisma.poll.findUnique({ where: { id } });
    if (!poll || poll.status === 'DELETED' || poll.status === 'REMOVED' || poll.status === 'HIDDEN') {
      throw new ApiException('POLL_NOT_FOUND', 'This poll is unavailable.', HttpStatus.NOT_FOUND);
    }
    return poll;
  }

  private async upsertTags(names: string[]) {
    const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 8);
    return Promise.all(
      unique.map((name) =>
        this.prisma.tag.upsert({
          where: { slug: slugify(name) || name.toLowerCase() },
          create: { slug: slugify(name) || name.toLowerCase(), name },
          update: {},
        }),
      ),
    );
  }
}

export const pollInclude = {
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  options: true,
  category: { select: { id: true, slug: true, name: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.PollInclude;

function resolveExpiry(duration?: string, custom?: string) {
  if (custom) {
    const date = new Date(custom);
    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      throw new ApiException('INVALID_EXPIRY', 'Choose a future expiration date.', HttpStatus.BAD_REQUEST);
    }
    return date;
  }
  if (!duration || duration === 'none') return null;
  const hours = DURATION_HOURS[duration];
  if (hours == null && duration !== 'none') {
    throw new ApiException('INVALID_DURATION', 'That poll duration is not supported.', HttpStatus.BAD_REQUEST);
  }
  if (!hours) return null;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export { isExpired };
