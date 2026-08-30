import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { OptionalAuthGuard } from '../common/guards/auth.guard';
import { OptionalUser } from '../common/decorators/optional-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  query(@Query('q') q: string, @OptionalUser() user?: AuthUser) {
    return this.search.search(q ?? '', user?.id);
  }
}
