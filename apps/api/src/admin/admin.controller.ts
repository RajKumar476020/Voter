import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AccountStatus, PollStatus, ReportStatus, Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';
import { IsEnum, IsOptional, IsString } from 'class-validator';

class StatusDto {
  @IsEnum(AccountStatus)
  status!: AccountStatus;
}

class PollStatusDto {
  @IsEnum(PollStatus)
  status!: PollStatus;
}

class ReportStatusDto {
  @IsEnum(ReportStatus)
  status!: ReportStatus;
}

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('users')
  users(@Query('q') q?: string, @Query('status') status?: AccountStatus) {
    return this.admin.users(q, status);
  }

  @Patch('users/:id')
  setUser(@Param('id') id: string, @Body() dto: StatusDto) {
    return this.admin.setUserStatus(id, dto.status);
  }

  @Get('polls')
  polls(@Query('q') q?: string) {
    return this.admin.polls(q);
  }

  @Patch('polls/:id')
  setPoll(@Param('id') id: string, @Body() dto: PollStatusDto) {
    return this.admin.setPollStatus(id, dto.status);
  }

  @Get('comments')
  comments(@Query('q') q?: string) {
    return this.admin.comments(q);
  }

  @Patch('comments/:id/remove')
  removeComment(@Param('id') id: string) {
    return this.admin.removeComment(id);
  }

  @Get('reports')
  reports(@Query('status') status?: ReportStatus) {
    return this.admin.reports(status);
  }

  @Patch('reports/:id')
  review(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: ReportStatusDto) {
    return this.admin.reviewReport(id, user, dto.status);
  }
}
