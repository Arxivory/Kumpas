import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateManualTransactionDto } from './dto/create-manual-transaction.dto';
import { CreateCycleDto } from './dto/create-cycle-dto';
import { CreateWalletDto } from './dto/create-wallet.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

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
        'No active Allowance Cycle found. Set up your budget timeframe first.'
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
          timestamp: now,
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
      where: { userId },
      orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
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

    const wallets = await this.prisma.wallet.findMany({ where: { userId } });
    const totalCurrentBalance = wallets.reduce((sum, w) => sum + w.balance.toNumber(), 0);

    const today = new Date();
    const endDate = new Date(currentCycle.endDate);
    const timeDiff = endDate.getTime() - today.getTime();
    const remainingDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

    const expenses = currentCycle.transactions.filter(tx => tx.amount.toNumber() < 0);
    const totalSpent = Math.abs(expenses.reduce((sum, tx) => sum + tx.amount.toNumber(), 0));
    
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
      currentBalance: totalCurrentBalance,
      burnVelocity: burnVelocity || 0,
      recentTransactions: currentCycle.transactions.slice(-5).reverse(),
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
}