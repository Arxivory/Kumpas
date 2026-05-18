import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateManualTransactionDto } from './dto/create-manual-transaction.dto';
import { CreateCycleDto } from './dto/create-cycle-dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateCycleDto } from './dto/update-cycle.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService
  ) {}

  async calculateQuantMetrics(userId: string) {
    const now = new Date();

    const currentCycle = await this.prisma.allowanceCycle.findFirst({
      where: { userId },
      orderBy: { endDate: 'desc' },
    });

    if (!currentCycle) {
      throw new Error('No active allowance cycle found.');
    }

    const trainingData = await this.getMlTrainingData(userId);
    if (trainingData.length >= 5) {
      try {
        await firstValueFrom(
          this.httpService.post('http://127.0.0.1:8000/analytics/train-profile', {
            transactions: trainingData,
          })
        );
      } catch (err) {
        console.error('ML Profile Training Step Skipped:', err.message);
      }
    }

    const historyEntries = await this.prisma.transaction.findMany({
      where: { userId, amount: { lt: 0 } },
    });

    const dailyMap: Record<string, number> = {};
    historyEntries.forEach((tx) => {
      const dateKey = new Date(tx.timestamp).toISOString().split('T')[0];
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + Math.abs(Number(tx.amount));
    });

    const dailySpends = Object.values(dailyMap);
    const driftMu = dailySpends.length > 0 ? dailySpends.reduce((a, b) => a + b, 0) / dailySpends.length : 0;
    const variance = dailySpends.length > 0 ? dailySpends.reduce((sum, val) => sum + Math.pow(val - driftMu, 2), 0) / dailySpends.length : 0;
    const volatilitySigma = Math.sqrt(variance);

    const cycleStart = new Date(currentCycle.startDate);
    const timeFromStart = now.getTime() - cycleStart.getTime();
    const currentDayOfCycle = Math.max(0, Math.floor(timeFromStart / (1000 * 60 * 60 * 24)));

    const targetEnd = new Date(currentCycle.endDate);
    const daysToDrop = Math.max(0, Math.ceil((targetEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const wallets = await this.prisma.wallet.findMany({ where: { userId, isActive: true } });
    const initialBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

    try {
      const response = await firstValueFrom(
        this.httpService.post('http://127.0.0.1:8000/analytics/simulate-runway', {
          initial_balance: initialBalance,
          drift_mu: driftMu,
          volatility_sigma: volatilitySigma,
          days_to_drop: daysToDrop,
          current_day_of_cycle: currentDayOfCycle,
          current_day_of_week: now.getDay(),
        })
      );

      return {
        survivalProbability: response.data.survival_probability,
        expectedDepletionDay: response.data.expected_depletion_day,
        riskStatus: response.data.risk_status,
        driftMu,
        volatilitySigma,
      };
    } catch (error) {
      console.error('Analytics Sidecar Connection Interrupted:', error.message);
      return {
        survivalProbability: initialBalance / (driftMu || 1) >= daysToDrop ? 0.95 : 0.15,
        expectedDepletionDay: Math.round(initialBalance / (driftMu || 1)),
        riskStatus: 'OVERCAST_TURBULENCE',
        driftMu,
        volatilitySigma,
      };
    }
  }

  async createCustomWallet(dto: CreateWalletDto) {
    return await this.prisma.wallet.create({
      data: {
        userId: dto.userId!,
        name: dto.name,
        balance: dto.initialBalance || 0.00,
        isMain: false,
      },
    });
  }

  async createManualEntry(dto: CreateManualTransactionDto) {
    const transactionTargetDate = dto.timestamp ? new Date(dto.timestamp) : new Date();

    const activeCycle = await this.prisma.allowanceCycle.findFirst({
      where: {
        userId: dto.userId,
        startDate: { lte: transactionTargetDate },
        endDate: { gte: transactionTargetDate },
      },
    });

    if (!activeCycle) {
      throw new BadRequestException(
        'No active Allowance Cycle found for the selected date. Set up your budget timeframe first.'
      );
    }

    const targetWallet = await this.prisma.wallet.findFirst({
      where: { id: dto.walletId, userId: dto.userId },
    });

    if (!targetWallet) {
      throw new NotFoundException('The chosen payment wallet was not found.');
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: targetWallet.id },
        data: { balance: { increment: dto.amount } },
      });

      return await tx.transaction.create({
        data: {
          userId: dto.userId!,
          cycleId: activeCycle.id,
          walletId: targetWallet.id,
          amount: dto.amount,
          category: dto.category,
          merchant: dto.merchant || null,
          timestamp: transactionTargetDate,
        },
      });
    });
  }

  async createAllowanceCycle(dto: CreateCycleDto) {
    const end = new Date(dto.startDate);
    const start = new Date(end);

    switch (dto.cadence) {
      case 'WEEKLY': start.setDate(end.getDate() - 7); break;
      case 'BI_WEEKLY': start.setDate(end.getDate() - 14); break;
      case 'MONTHLY': start.setMonth(end.getMonth() - 1); break;
      default: start.setDate(end.getDate() - 7);
    }

    return await this.prisma.$transaction(async (tx) => {
      let mainWallet = await tx.wallet.findFirst({
        where: { userId: dto.userId, isMain: true },
      });

      const startingLiquidity = dto.initialWalletBalance !== undefined 
        ? dto.initialWalletBalance 
        : dto.amount;

      if (!mainWallet) {
        mainWallet = await tx.wallet.create({
          data: {
            userId: dto.userId!,
            name: 'Main Wallet',
            balance: startingLiquidity,
            isMain: true,
          },
        });
      } else {
        await tx.wallet.update({
          where: { id: mainWallet.id },
          data: { balance: startingLiquidity },
        });
      }

      return await tx.allowanceCycle.create({
        data: {
          userId: dto.userId!,
          amount: dto.amount,
          cadence: dto.cadence,
          startDate: start,
          endDate: end,
        },
      });
    });
  }

  async getUserWallets(userId: string) {
    return await this.prisma.wallet.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
    });
  }

  async getDashboardSummary(userId: string): Promise<any> {
    const now = new Date();

    let currentCycle = await this.prisma.allowanceCycle.findFirst({
      where: { userId },
      orderBy: { endDate: 'desc' },
      include: { transactions: true },
    });

    if (!currentCycle) {
      return { hasActiveCycle: false };
    }

    if (now > new Date(currentCycle.endDate)) {
      const nextStartDate = new Date(currentCycle.endDate);
      
      const nextEndDate = new Date(nextStartDate);
      switch (currentCycle.cadence) {
        case 'WEEKLY': nextEndDate.setDate(nextStartDate.getDate() + 7); break;
        case 'BI_WEEKLY': nextEndDate.setDate(nextStartDate.getDate() + 14); break;
        case 'MONTHLY': nextEndDate.setMonth(nextStartDate.getMonth() + 1); break;
        default: nextEndDate.setDate(nextStartDate.getDate() + 7);
      }

      await this.prisma.allowanceCycle.create({
        data: {
          userId,
          amount: currentCycle.amount,
          cadence: currentCycle.cadence,
          startDate: nextStartDate,
          endDate: nextEndDate,
        },
      });

      currentCycle = await this.prisma.allowanceCycle.findFirst({
        where: { userId },
        orderBy: { endDate: 'desc' },
        include: { transactions: true },
      });
    }

    const wallets = await this.prisma.wallet.findMany({ where: { userId, isActive: true } });
    const totalCurrentBalance = wallets.reduce((sum, w) => sum + w.balance.toNumber(), 0);

    const endDate = new Date(currentCycle!.endDate);
    const timeDiff = endDate.getTime() - now.getTime();
    const remainingDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

    const expenses = currentCycle!.transactions.filter(tx => tx.amount.toNumber() < 0);
    const totalSpent = Math.abs(expenses.reduce((sum, tx) => sum + tx.amount.toNumber(), 0));
    
    const startDate = new Date(currentCycle!.startDate);
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const burnVelocity = totalSpent / daysElapsed;

    return {
      hasActiveCycle: true,
      cycleId: currentCycle!.id,
      baselineAmount: currentCycle!.amount,
      cadence: currentCycle!.cadence,
      dropDate: currentCycle!.endDate,
      remainingDays,
      currentBalance: totalCurrentBalance,
      burnVelocity: burnVelocity || 0,
      recentTransactions: currentCycle!.transactions.slice(-5).reverse(),
    };
  }

  async reconcileWalletBalance(walletId: string, userId: string, newBalance: number) {
    const now = new Date();

    const activeCycle = await this.prisma.allowanceCycle.findFirst({
      where: {
        userId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    if (!activeCycle) {
      throw new BadRequestException(
        'Cannot reconcile balance without an active Allowance Cycle baseline.'
      );
    }

    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Target liquidity account not found.');
    }

    const currentBalanceNum = wallet.balance.toNumber();
    const deltaAmount = newBalance - currentBalanceNum;

    if (deltaAmount === 0) {
      return wallet;
    }

    return await this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: newBalance },
      });

      await tx.transaction.create({
        data: {
          userId,
          cycleId: activeCycle.id,
          walletId: wallet.id,
          amount: deltaAmount,
          category: 'ADJUSTMENT',
          merchant: deltaAmount > 0 ? 'Balance Sync (Found Funds)' : 'Balance Sync (Missed Outflows)',
          timestamp: now,
        },
      });

      return updatedWallet;
    });
  }

  async archiveWallet(walletId: string, userId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Target liquidity vault not found.');
    }

    if (wallet.isMain) {
      throw new BadRequestException('The Protected Core Main Wallet cannot be archived.');
    }

    return await this.prisma.wallet.update({
      where: { id: walletId },
      data: { isActive: false },
    });
  }

  async updateActiveCycle(cycleId: string, userId: string, dto: UpdateCycleDto) {
    const currentCycle = await this.prisma.allowanceCycle.findFirst({
      where: { id: cycleId, userId },
    });

    if (!currentCycle) {
      throw new NotFoundException('No active budget cycle configuration found.');
    }

    const targetEnd = new Date(dto.endDate);
    const targetStart = new Date(targetEnd);

    switch (currentCycle.cadence) {
      case 'WEEKLY': targetStart.setDate(targetEnd.getDate() - 7); break;
      case 'BI_WEEKLY': targetStart.setDate(targetEnd.getDate() - 14); break;
      case 'MONTHLY': targetStart.setMonth(targetEnd.getMonth() - 1); break;
      default: targetStart.setDate(targetEnd.getDate() - 7);
    }

    return await this.prisma.allowanceCycle.update({
      where: { id: cycleId },
      data: {
        amount: dto.amount,
        startDate: targetStart,
        endDate: targetEnd,
      },
    });
  }

  async getMlTrainingData(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        amount: { lt: 0 },
      },
      include: {
        cycle: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return transactions.map((tx) => {
      const txDate = new Date(tx.timestamp);
      const cycleStartDate = new Date(tx.cycle.startDate);
      
      const timeDiff = txDate.getTime() - cycleStartDate.getTime();
      const dayOfCycle = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
      
      const cycleDurationTime = new Date(tx.cycle.endDate).getTime() - cycleStartDate.getTime();
      const totalCycleDays = Math.max(1, Math.ceil(cycleDurationTime / (1000 * 60 * 60 * 24)));

      const phaseProgressPct = Math.min(1.0, dayOfCycle / totalCycleDays);

      return {
        dayOfCycle,
        phaseProgressPct,
        dayOfWeek: txDate.getDay(),
        category: tx.category,
        amount: Math.abs(Number(tx.amount)),
      };
    });
  }
}