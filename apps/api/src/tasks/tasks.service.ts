import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PollStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expirePolls() {
    await this.prisma.poll.updateMany({
      where: {
        status: PollStatus.ACTIVE,
        expiresAt: { lte: new Date() },
      },
      data: { status: PollStatus.EXPIRED },
    });
  }
}
