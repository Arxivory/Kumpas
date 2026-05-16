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

  async getDashboardSummary(userId: string) {
    const currentCycle = await this.prisma.allowanceCycle.findFirst({
      where: { userId },
      orderBy: { startDate: 'desc' },
      include: { transactions: true },
    });

    if (!currentCycle) {
      return { hasActiveCycle: false };
    }

    const today = new Date();
    const endDate = new Date(currentCycle.endDate);
    
    const timeDiff = endDate.getTime() - today.getTime();
    const remainingDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

    const transactionSum = currentCycle.transactions.reduce(
      (sum, tx) => sum + (tx.amount).toNumber(), 
      0
    );
    const currentBalance = (currentCycle.amount).toNumber() + transactionSum;

    const expenses = currentCycle.transactions.filter(tx => (tx.amount).toNumber() < 0);
    const totalSpent = Math.abs(expenses.reduce((sum, tx) => sum + (tx.amount).toNumber(), 0));
    
    const startDate = new Date(currentCycle.startDate);
    const daysElapsed = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const burnVelocity = totalSpent / daysElapsed;

    return {
      hasActiveCycle: true,
      cycleId: currentCycle.id,
      baselineAmount: currentCycle.amount,
      cadence: currentCycle.cadence,
      dropDate: currentCycle.endDate,
      remainingDays,
      currentBalance,
      burnVelocity: burnVelocity || 0,
      recentTransactions: currentCycle.transactions.slice(-5).reverse(),
    };
  }
}