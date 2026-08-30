import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@Controller('users')
export class FollowsController {
  constructor(private readonly follows: FollowsService) {}

  @Post(':id/follow')
  @UseGuards(AuthGuard)
  follow(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.follows.follow(user, id);
  }

  @Delete(':id/follow')
  @UseGuards(AuthGuard)
  unfollow(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.follows.unfollow(user, id);
  }
}
