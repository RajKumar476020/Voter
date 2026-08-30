import { Module } from '@nestjs/common';
import { PollsService } from './polls.service';
import { MeSavedController, PollsController } from './polls.controller';
import { VotesService } from '../votes/votes.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PollsController, MeSavedController],
  providers: [PollsService, VotesService],
  exports: [PollsService, VotesService],
})
export class PollsModule {}
