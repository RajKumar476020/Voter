import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PollsService } from './polls.service';
import { VotesService } from '../votes/votes.service';
import { AuthGuard, OptionalAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalUser } from '../common/decorators/optional-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { CreatePollDto, UpdatePollDto, VoteDto } from './dto/poll.dto';
import { CursorPaginationDto } from '../common/dto/pagination.dto';

@Controller('polls')
export class PollsController {
  constructor(
    private readonly polls: PollsService,
    private readonly votes: VotesService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePollDto) {
    return this.polls.create(user, dto);
  }

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  findOne(@Param('id') id: string, @OptionalUser() user?: AuthUser) {
    return this.polls.findOne(id, user?.id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdatePollDto) {
    return this.polls.update(id, user, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.polls.remove(id, user);
  }

  @Post(':id/vote')
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  vote(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: VoteDto) {
    return this.votes.vote(id, user, dto);
  }

  @Get(':id/results')
  @UseGuards(OptionalAuthGuard)
  results(@Param('id') id: string, @OptionalUser() user?: AuthUser) {
    return this.votes.results(id, user?.id);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard)
  like(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.polls.like(id, user);
  }

  @Delete(':id/like')
  @UseGuards(AuthGuard)
  unlike(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.polls.unlike(id, user);
  }

  @Post(':id/save')
  @UseGuards(AuthGuard)
  save(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.polls.save(id, user);
  }

  @Delete(':id/save')
  @UseGuards(AuthGuard)
  unsave(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.polls.unsave(id, user);
  }

  @Post(':id/share')
  @UseGuards(OptionalAuthGuard)
  share(@Param('id') id: string) {
    return this.polls.share(id);
  }
}

@Controller()
export class MeSavedController {
  constructor(private readonly polls: PollsService) {}

  @Get('users/me/saved')
  @UseGuards(AuthGuard)
  saved(@CurrentUser() user: AuthUser, @Query() query: CursorPaginationDto) {
    return this.polls.saved(user.id, query.cursor, query.limit);
  }
}
