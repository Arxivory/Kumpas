import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateManualTransactionDto } from './dto/create-manual-transaction.dto';
import { CreateCycleDto } from './dto/create-cycle-dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/users/get-user.decorator';
import { SupabaseAuthGuard } from 'src/users/supabase-auth.guard';

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
}