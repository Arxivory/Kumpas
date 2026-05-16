import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateManualTransactionDto } from './dto/create-manual-transaction.dto';
import { CreateCycleDto } from './dto/create-cycle-dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createManualEntry(dto: CreateManualTransactionDto) {
    const now = new Date();

    const activeCycle = await this.prisma.allowanceCycle.findFirst({
      where: {
        userId: dto.userId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (!activeCycle) {
      throw new BadRequestException(
        'No active Allowance Cycle found for this period. Please set up your budget cycle first.'
      );
    }

    return await this.prisma.transaction.create({
      data: {
        userId: dto.userId,
        cycleId: activeCycle.id,
        amount: dto.amount,
        category: dto.category,
        merchant: dto.merchant || null,
        timestamp: now,
      },
    });
  }

  async createAllowanceCycle(dto: CreateCycleDto) {
    const start = new Date(dto.startDate);
    const end = new Date(start);

    switch (dto.cadence) {
      case 'WEEKLY':
        end.setDate(start.getDate() + 7);
        break;
      case 'BI_WEEKLY':
        end.setDate(start.getDate() + 14);
        break;
      case 'MONTHLY':
        end.setMonth(start.getMonth() + 1);
        break;
      default:
        end.setDate(start.getDate() + 7);
    }

    return await this.prisma.allowanceCycle.create({
      data: {
        userId: dto.userId,
        amount: dto.amount,
        cadence: dto.cadence,
        startDate: start,
        endDate: end,
      },
    });
  }
}