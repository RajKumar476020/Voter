import { HttpStatus, Injectable } from '@nestjs/common';
import { PollType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/errors';
import { isVotable } from '../polls/poll.serializer';
import { NotificationsService } from '../notifications/notifications.service';
import { PollsService } from '../polls/polls.service';
import { VoteDto } from '../polls/dto/poll.dto';
import { AuthUser } from '../common/types/auth-user';

const MILESTONES = [10, 50, 100, 500, 1000, 5000, 10000];

@Injectable()
export class VotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly polls: PollsService,
  ) {}

  async vote(pollId: string, user: AuthUser, dto: VoteDto) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });
    if (!poll) {
      throw new ApiException('POLL_NOT_FOUND', 'This poll is unavailable.', HttpStatus.NOT_FOUND);
    }
    if (!isVotable(poll)) {
      throw new ApiException('POLL_EXPIRED', 'This poll is no longer accepting votes.', HttpStatus.CONFLICT);
    }

    const uniqueIds = [...new Set(dto.optionIds)];
    if (poll.pollType === PollType.SINGLE && uniqueIds.length !== 1) {
      throw new ApiException('INVALID_VOTE', 'Choose exactly one option.', HttpStatus.BAD_REQUEST);
    }
    const optionSet = new Set(poll.options.map((o) => o.id));
    if (uniqueIds.some((id) => !optionSet.has(id))) {
      throw new ApiException('INVALID_OPTION', 'One of those options does not belong to this poll.', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const submission = await tx.voteSubmission.create({
          data: {
            pollId,
            userId: user.id,
            choices: { create: uniqueIds.map((optionId) => ({ optionId })) },
          },
        });
        await Promise.all(
          uniqueIds.map((optionId) =>
            tx.pollOption.update({ where: { id: optionId }, data: { voteCount: { increment: 1 } } }),
          ),
        );
        await tx.poll.update({ where: { id: pollId }, data: { voteCount: { increment: 1 } } });
        return submission;
      });
    } catch {
      throw new ApiException('ALREADY_VOTED', 'You have already voted on this poll.', HttpStatus.CONFLICT);
    }

    if (poll.userId !== user.id) {
      await this.notifications.create({
        userId: poll.userId,
        actorId: user.id,
        type: 'VOTE',
        referenceId: pollId,
      });
    }

    const updated = await this.prisma.poll.findUniqueOrThrow({ where: { id: pollId } });
    if (MILESTONES.includes(updated.voteCount)) {
      await this.notifications.create({
        userId: poll.userId,
        actorId: null,
        type: 'MILESTONE',
        referenceId: pollId,
      });
    }

    return this.polls.findOne(pollId, user.id);
  }

  async results(pollId: string, viewerId?: string) {
    return this.polls.findOne(pollId, viewerId);
  }
}
