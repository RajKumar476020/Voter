import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FeedService } from './feed.service';
import { OptionalAuthGuard } from '../common/guards/auth.guard';
import { OptionalUser } from '../common/decorators/optional-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { IsOptional, IsString } from 'class-validator';
import { CursorPaginationDto } from '../common/dto/pagination.dto';

class FeedQuery extends CursorPaginationDto {
  @IsOptional()
  @IsString()
  tab?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

@Controller()
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get('feed')
  @UseGuards(OptionalAuthGuard)
  home(@Query() query: FeedQuery, @OptionalUser() user?: AuthUser) {
    return this.feed.home(query.tab ?? 'for-you', user?.id, query.cursor, query.limit, query.category);
  }

  @Get('explore')
  @UseGuards(OptionalAuthGuard)
  explore(@Query() query: FeedQuery, @OptionalUser() user?: AuthUser) {
    return this.feed.explore(query.sort ?? 'trending', user?.id, query.cursor, query.limit, query.category);
  }
}
