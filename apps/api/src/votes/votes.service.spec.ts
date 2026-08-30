import { VotesService } from './votes.service';
import { PollType, PollStatus } from '@prisma/client';

describe('VotesService validation', () => {
  const prisma = {
    poll: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    voteSubmission: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const notifications = { create: jest.fn() };
  const polls = { findOne: jest.fn() };
  const service = new VotesService(prisma as never, notifications as never, polls as never);
  const user = { id: 'u1', username: 'rahul', email: 'r@x.com', role: 'USER', status: 'ACTIVE', displayName: 'Rahul', avatarUrl: null };

  it('rejects votes on expired polls', async () => {
    prisma.poll.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'u2',
      pollType: PollType.SINGLE,
      status: PollStatus.EXPIRED,
      expiresAt: new Date(Date.now() - 1000),
      options: [{ id: 'o1' }],
    });
    await expect(service.vote('p1', user as never, { optionIds: ['o1'] })).rejects.toMatchObject({
      response: { code: 'POLL_EXPIRED' },
    });
  });

  it('rejects a second option on single-choice polls', async () => {
    prisma.poll.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'u2',
      pollType: PollType.SINGLE,
      status: PollStatus.ACTIVE,
      expiresAt: null,
      options: [{ id: 'o1' }, { id: 'o2' }],
    });
    await expect(service.vote('p1', user as never, { optionIds: ['o1', 'o2'] })).rejects.toMatchObject({
      response: { code: 'INVALID_VOTE' },
    });
  });

  it('rejects options that do not belong to the poll', async () => {
    prisma.poll.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'u2',
      pollType: PollType.SINGLE,
      status: PollStatus.ACTIVE,
      expiresAt: null,
      options: [{ id: 'o1' }],
    });
    await expect(service.vote('p1', user as never, { optionIds: ['other'] })).rejects.toMatchObject({
      response: { code: 'INVALID_OPTION' },
    });
  });
});
