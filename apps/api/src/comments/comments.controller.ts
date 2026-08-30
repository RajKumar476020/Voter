import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CommentsService } from './comments.service';
import { AuthGuard, OptionalAuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalUser } from '../common/decorators/optional-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CursorPaginationDto } from '../common/dto/pagination.dto';

@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get('polls/:id/comments')
  @UseGuards(OptionalAuthGuard)
  list(
    @Param('id') id: string,
    @Query() query: CursorPaginationDto,
    @OptionalUser() user?: AuthUser,
  ) {
    return this.comments.list(id, user?.id, query.cursor, query.limit);
  }

  @Post('polls/:id/comments')
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  create(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: CreateCommentDto) {
    return this.comments.create(id, user, dto);
  }

  @Delete('comments/:id')
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.comments.remove(id, user);
  }

  @Post('comments/:id/like')
  @UseGuards(AuthGuard)
  like(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.comments.like(id, user);
  }

  @Delete('comments/:id/like')
  @UseGuards(AuthGuard)
  unlike(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.comments.unlike(id, user);
  }
}
