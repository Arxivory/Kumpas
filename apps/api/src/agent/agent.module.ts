import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { TransactionsService } from '../transactions/transactions.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [AgentController],
  providers: [AgentService, TransactionsService, PrismaService],
  exports: [AgentService],
})
export class AgentModule {}