import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { PollsModule } from '../polls/polls.module';

@Module({
  imports: [PollsModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
