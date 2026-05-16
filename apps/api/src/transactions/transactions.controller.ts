import { Controller, Post, Body } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateManualTransactionDto } from './dto/create-manual-transaction.dto';
import { CreateCycleDto } from './dto/create-cycle-dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('manual')
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