import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { PollsModule } from '../polls/polls.module';

@Module({
  imports: [PollsModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
