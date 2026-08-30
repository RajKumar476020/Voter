import { Module } from '@nestjs/common';
import { PollsModule } from '../polls/polls.module';

@Module({
  imports: [PollsModule],
  exports: [PollsModule],
})
export class VotesModule {}
