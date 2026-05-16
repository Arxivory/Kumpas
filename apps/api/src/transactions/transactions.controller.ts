import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateManualTransactionDto } from './dto/create-manual-transaction.dto';
import { CreateCycleDto } from './dto/create-cycle-dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('manual')
  @UseGuards(AuthGuard('jwt'))
  async logExpense(@Body() dto: CreateManualTransactionDto) {
    const transaction = await this.transactionsService.createManualEntry(dto);
    return {
      success: true,
      message: 'Transaction recorded successfully into current budget window.',
      data: transaction,
    };
  }

  @Post('cycle')
  async initializeBudget(@Body() dto: CreateCycleDto) {
    const cycle = await this.transactionsService.createAllowanceCycle(dto);
    return {
      success: true,
      message: 'New Allowance Cycle initialized successfully.',
      data: cycle,
    };
  }
}