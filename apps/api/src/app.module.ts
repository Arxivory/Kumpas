import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { UsersModule } from './users/users.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AgentModule } from './agent/agent.module';

@Module({
  imports: [UsersModule, TransactionsModule, AgentModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
