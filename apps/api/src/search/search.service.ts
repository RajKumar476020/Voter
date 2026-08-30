import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { pollInclude, PollsService } from '../polls/polls.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly polls: PollsService,
  ) {}

  async search(q: string, viewerId?: string) {
    const query = q.trim();
    if (!query) return { polls: [], users: [], tags: [], categories: [] };

    const [polls, users, tags, categories] = await Promise.all([
      this.prisma.poll.findMany({
        where: {
          status: { in: ['ACTIVE', 'EXPIRED'] },
          OR: [
            { question: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: pollInclude,
      }),
      this.prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true },
      }),
      this.prisma.tag.findMany({
        where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { slug: { contains: query, mode: 'insensitive' } }] },
        take: 10,
      }),
      this.prisma.category.findMany({
        where: { OR: [{ name: { contains: query, mode: 'insensitive' } }, { slug: { contains: query, mode: 'insensitive' } }] },
        take: 10,
      }),
    ]);

    const serialized = await Promise.all(polls.map((poll) => this.polls.withViewerState(poll, viewerId)));
    return { polls: serialized, users, tags, categories };
  }
}
