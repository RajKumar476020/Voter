import { FollowsService } from './follows.service';

describe('FollowsService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    block: { findFirst: jest.fn() },
    follow: { upsert: jest.fn(), deleteMany: jest.fn() },
  };
  const notifications = { create: jest.fn() };
  const service = new FollowsService(prisma as never, notifications as never);
  const user = { id: 'u1', username: 'rahul', email: 'r@x.com', role: 'USER', status: 'ACTIVE', displayName: 'Rahul', avatarUrl: null };

  it('prevents following yourself', async () => {
    await expect(service.follow(user as never, 'u1')).rejects.toMatchObject({
      response: { code: 'INVALID_FOLLOW' },
    });
  });
});
