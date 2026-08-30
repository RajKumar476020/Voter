import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PollsModule } from '../polls/polls.module';
import { FollowsModule } from '../follows/follows.module';

@Module({
  imports: [PollsModule, FollowsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
