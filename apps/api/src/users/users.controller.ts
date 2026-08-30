import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { PollsService } from '../polls/polls.service';
import { FollowsService } from '../follows/follows.service';
import { AuthGuard, OptionalAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalUser } from '../common/decorators/optional-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CursorPaginationDto } from '../common/dto/pagination.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly polls: PollsService,
    private readonly follows: FollowsService,
  ) {}

  @Patch('me')
  @UseGuards(AuthGuard)
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateMe(user, dto);
  }

  @Get(':username')
  @UseGuards(OptionalAuthGuard)
  profile(@Param('username') username: string, @OptionalUser() user?: AuthUser) {
    return this.users.byUsername(username, user?.id);
  }

  @Get(':username/polls')
  @UseGuards(OptionalAuthGuard)
  pollsByUser(
    @Param('username') username: string,
    @Query() query: CursorPaginationDto,
    @OptionalUser() user?: AuthUser,
  ) {
    return this.polls.listByUser(username, query.cursor, query.limit, user?.id);
  }

  @Get(':username/votes')
  @UseGuards(OptionalAuthGuard)
  votes(
    @Param('username') username: string,
    @Query() query: CursorPaginationDto,
    @OptionalUser() user?: AuthUser,
  ) {
    return this.polls.votedByUser(username, query.cursor, query.limit, user?.id);
  }

  @Get(':username/liked')
  @UseGuards(OptionalAuthGuard)
  liked(
    @Param('username') username: string,
    @Query() query: CursorPaginationDto,
    @OptionalUser() user?: AuthUser,
  ) {
    return this.polls.likedByUser(username, query.cursor, query.limit, user?.id);
  }

  @Get(':username/followers')
  followers(@Param('username') username: string, @Query() query: CursorPaginationDto) {
    return this.follows.followers(username, query.cursor, query.limit);
  }

  @Get(':username/following')
  following(@Param('username') username: string, @Query() query: CursorPaginationDto) {
    return this.follows.following(username, query.cursor, query.limit);
  }

  @Patch(':id/block')
  @UseGuards(AuthGuard)
  block(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.users.block(user, id);
  }

  @Delete(':id/block')
  @UseGuards(AuthGuard)
  unblock(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.users.unblock(user, id);
  }
}
