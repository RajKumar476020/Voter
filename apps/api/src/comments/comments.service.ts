import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors';
import { AuthUser } from '../common/types/auth-user';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(pollId: string, viewerId?: string, cursor?: string, limit = 20) {
    const comments = await this.prisma.comment.findMany({
      where: { pollId, parentId: null, deletedAt: null, ...(cursor ? { id: { lt: cursor } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: commentInclude,
    });
    const hasMore = comments.length > limit;
    const slice = hasMore ? comments.slice(0, limit) : comments;
    const items = await Promise.all(slice.map((c) => this.serialize(c, viewerId)));
    return { items, nextCursor: hasMore ? slice[slice.length - 1].id : null };
  }

  async create(pollId: string, user: AuthUser, dto: CreateCommentDto) {
    const poll = await this.prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll || poll.status === 'DELETED' || poll.status === 'REMOVED') {
      throw new ApiException('POLL_NOT_FOUND', 'This poll is unavailable.', HttpStatus.NOT_FOUND);
    }
    if (!poll.allowComments) {
      throw new ApiException('COMMENTS_DISABLED', 'Comments are turned off for this poll.', HttpStatus.FORBIDDEN);
    }
    let parent = null;
    if (dto.parentId) {
      parent = await this.prisma.comment.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.pollId !== pollId) {
        throw new ApiException('INVALID_REPLY', 'You can only reply to comments on this poll.', HttpStatus.BAD_REQUEST);
      }
      if (parent.parentId) {
        throw new ApiException('NESTING_LIMIT', 'Replies can only be one level deep.', HttpStatus.BAD_REQUEST);
      }
    }
    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          pollId,
          userId: user.id,
          parentId: dto.parentId || null,
          content: dto.content.trim(),
        },
        include: commentInclude,
      });
      await tx.poll.update({ where: { id: pollId }, data: { commentCount: { increment: 1 } } });
      return created;
    });

    if (parent && parent.userId !== user.id) {
      await this.notifications.create({
        userId: parent.userId,
        actorId: user.id,
        type: 'REPLY',
        referenceId: pollId,
      });
    } else if (poll.userId !== user.id) {
      await this.notifications.create({
        userId: poll.userId,
        actorId: user.id,
        type: 'COMMENT',
        referenceId: pollId,
      });
    }

    const mention = dto.content.match(/@([a-zA-Z0-9_]+)/);
    if (mention) {
      const mentioned = await this.prisma.user.findUnique({ where: { username: mention[1].toLowerCase() } });
      if (mentioned && mentioned.id !== user.id) {
        await this.notifications.create({
          userId: mentioned.id,
          actorId: user.id,
          type: 'MENTION',
          referenceId: pollId,
        });
      }
    }

    return this.serialize(comment, user.id);
  }

  async remove(id: string, user: AuthUser) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.deletedAt) {
      throw new ApiException('COMMENT_NOT_FOUND', 'Comment not found.', HttpStatus.NOT_FOUND);
    }
    if (comment.userId !== user.id && user.role === 'USER') {
      throw new ApiException('FORBIDDEN', 'You cannot delete this comment.', HttpStatus.FORBIDDEN);
    }
    await this.prisma.$transaction([
      this.prisma.comment.update({ where: { id }, data: { deletedAt: new Date(), content: '' } }),
      this.prisma.poll.update({ where: { id: comment.pollId }, data: { commentCount: { decrement: 1 } } }),
    ]);
    return { ok: true };
  }

  async like(id: string, user: AuthUser) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new ApiException('COMMENT_NOT_FOUND', 'Comment not found.', HttpStatus.NOT_FOUND);
    try {
      await this.prisma.$transaction([
        this.prisma.commentLike.create({ data: { userId: user.id, commentId: id } }),
        this.prisma.comment.update({ where: { id }, data: { likeCount: { increment: 1 } } }),
      ]);
    } catch {
      return { liked: true };
    }
    return { liked: true };
  }

  async unlike(id: string, user: AuthUser) {
    const deleted = await this.prisma.commentLike.deleteMany({ where: { userId: user.id, commentId: id } });
    if (deleted.count) {
      await this.prisma.comment.update({ where: { id }, data: { likeCount: { decrement: 1 } } });
    }
    return { liked: false };
  }

  private async serialize(
    comment: {
      id: string;
      content: string;
      likeCount: number;
      createdAt: Date;
      parentId: string | null;
      user: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
      replies: Array<{
        id: string;
        content: string;
        likeCount: number;
        createdAt: Date;
        parentId: string | null;
        user: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
        replies?: unknown[];
      }>;
    },
    viewerId?: string,
  ) {
    const liked = viewerId
      ? Boolean(await this.prisma.commentLike.findUnique({ where: { userId_commentId: { userId: viewerId, commentId: comment.id } } }))
      : false;
    return {
      id: comment.id,
      content: comment.content,
      likeCount: comment.likeCount,
      createdAt: comment.createdAt,
      parentId: comment.parentId,
      liked,
      author: comment.user,
      replies: await Promise.all(
        (comment.replies ?? []).map(async (reply) => ({
          id: reply.id,
          content: reply.content,
          likeCount: reply.likeCount,
          createdAt: reply.createdAt,
          parentId: reply.parentId,
          author: reply.user,
          liked: viewerId
            ? Boolean(
                await this.prisma.commentLike.findUnique({
                  where: { userId_commentId: { userId: viewerId, commentId: reply.id } },
                }),
              )
            : false,
          replies: [],
        })),
      ),
    };
  }
}

const commentInclude = {
  user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  replies: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' as const },
    include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
  },
};
