import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, PrismaService],
})
export class TransactionsModule {}