import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { AuthUser } from '../common/types/auth-user';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateReportDto) {
    return this.prisma.report.create({
      data: {
        reporterId: user.id,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        description: dto.description?.trim() || null,
      },
    });
  }
}
