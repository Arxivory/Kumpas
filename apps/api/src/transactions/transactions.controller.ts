import { Controller, Post, Body, UseGuards, Get, ParseUUIDPipe, Param, Patch } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateManualTransactionDto } from './dto/create-manual-transaction.dto';
import { CreateCycleDto } from './dto/create-cycle-dto';
import { GetUser } from 'src/users/get-user.decorator';
import { SupabaseAuthGuard } from 'src/users/supabase-auth.guard';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { ReconcileWalletDto } from './dto/reconcile-wallet.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('manual')
  @UseGuards(SupabaseAuthGuard)
  async logExpense(@Body() dto: CreateManualTransactionDto, @GetUser() user: { userId: string }) {
    dto.userId = user.userId;
    const transaction = await this.transactionsService.createManualEntry(dto);
    return {
      success: true,
      message: 'Transaction recorded successfully into current budget window.',
      data: transaction,
    };
  }

  @Post('cycle')
  @UseGuards(SupabaseAuthGuard)
  async initializeBudget(@Body() dto: CreateCycleDto, @GetUser() user: { userId: string }) {
    dto.userId = user.userId;
    const cycle = await this.transactionsService.createAllowanceCycle(dto);
    return {
      success: true,
      message: 'New Allowance Cycle initialized successfully.',
      data: cycle,
    };
  }

  @Get('dashboard-summary')
  @UseGuards(SupabaseAuthGuard)
  async getDashboardSummary(@GetUser() user: { userId: string }) {
    return this.transactionsService.getDashboardSummary(user.userId);
  }

  @Get('wallets')
  @UseGuards(SupabaseAuthGuard)
  async fetchWallets(@GetUser() user: { userId: string }) {
    return await this.transactionsService.getUserWallets(user.userId);
  }

  @Post('wallets')
  @UseGuards(SupabaseAuthGuard)
  async addNewWallet(@Body() dto: CreateWalletDto, @GetUser() user: { userId: string }) {
    dto.userId = user.userId;
    const newWallet = await this.transactionsService.createCustomWallet(dto);
    return {
      success: true,
      message: 'Wallet infrastructure added to ledger account successfully.',
      data: newWallet,
    };
  }

  @Patch('wallets/:id/reconcile')
  @UseGuards(SupabaseAuthGuard)
  async reconcileWallet(
    @Param('id', new ParseUUIDPipe()) walletId: string,
    @Body() dto: ReconcileWalletDto,
    @GetUser() user: { userId: string }
  ) {
    return await this.transactionsService.reconcileWalletBalance(
      walletId,
      user.userId,
      dto.newBalance
    );
  }
}