import { HttpStatus, Injectable } from '@nestjs/common';
import { AccountStatus, PollStatus, Prisma, ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors';
import { AuthUser } from '../common/types/auth-user';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [
      users,
      polls,
      votes,
      comments,
      reportsPending,
      newUsers,
      activeSessions,
      pollsWeek,
    ] = await Promise.all([
      this.prisma.user.count({ where: { status: { not: 'DELETED' } } }),
      this.prisma.poll.count({ where: { status: { not: 'DELETED' } } }),
      this.prisma.voteSubmission.count(),
      this.prisma.comment.count({ where: { deletedAt: null } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.user.count({ where: { createdAt: { gte: since } } }),
      this.prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
      this.prisma.poll.count({ where: { createdAt: { gte: week } } }),
    ]);
    return {
      totalUsers: users,
      activeUsers: activeSessions,
      totalPolls: polls,
      totalVotes: votes,
      totalComments: comments,
      reports: reportsPending,
      newUsers,
      pollActivity: pollsWeek,
    };
  }

  async users(q?: string, status?: AccountStatus) {
    return this.prisma.user.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { username: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async setUserStatus(id: string, status: AccountStatus) {
    if (status === 'BANNED' || status === 'DELETED') {
      await this.prisma.session.deleteMany({ where: { userId: id } });
    }
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, username: true, status: true },
    });
  }

  async polls(q?: string) {
    return this.prisma.poll.findMany({
      where: {
        ...(q ? { question: { contains: q, mode: 'insensitive' } } : {}),
        status: { not: PollStatus.DELETED },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: { select: { username: true, displayName: true } },
      },
    });
  }

  async setPollStatus(id: string, status: PollStatus) {
    return this.prisma.poll.update({ where: { id }, data: { status } });
  }

  async comments(q?: string) {
    return this.prisma.comment.findMany({
      where: {
        deletedAt: null,
        ...(q ? { content: { contains: q, mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { username: true } },
        poll: { select: { id: true, question: true } },
      },
    });
  }

  async removeComment(id: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new ApiException('COMMENT_NOT_FOUND', 'Comment not found.', HttpStatus.NOT_FOUND);
    await this.prisma.comment.update({ where: { id }, data: { deletedAt: new Date(), content: '' } });
    return { ok: true };
  }

  async reports(status?: ReportStatus) {
    return this.prisma.report.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        reporter: { select: { username: true } },
      },
    });
  }

  async reviewReport(id: string, admin: AuthUser, status: ReportStatus) {
    return this.prisma.report.update({
      where: { id },
      data: { status, reviewedById: admin.id, reviewedAt: new Date() },
    });
  }
}
