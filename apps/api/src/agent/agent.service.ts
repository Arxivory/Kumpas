import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AGENT_TOOLS } from './agent.tools';
import OpenAI from 'openai';

@Injectable()
export class AgentService {
  private openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async processAgentChat(userId: string, incomingMessage: string, history: any[] = []) {
    const messages: any[] = [
      {
        role: 'system',
        content: `You are Kumpas AI, an intelligent, helpful, and direct financial companion agent for college students. 
        You have direct access to tools that can check their active wallet health, simulate financial shock outcomes using their specific Python machine learning variables, and record expenses.
        Always maintain a supportive peer-to-peer tone. Keep explanations clear and action-focused. 
        When talking about money values, use the Philippine Peso sign (₱). Avoid generic placeholder financial filler advice. Always lean on your actual tool responses.`,
      },
      ...history,
      { role: 'user', content: incomingMessage },
    ];

    let loopLimit = 0;
    
    while (loopLimit < 4) {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools: AGENT_TOOLS,
        tool_choice: 'auto',
      });

      const responseMessage = response.choices[0].message;
      messages.push(responseMessage);

      if (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0) {
        return {
          answer: responseMessage.content,
          updatedHistory: messages.filter(m => m.role !== 'system'),
        };
      }

      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.type !== 'function') continue;
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let toolOutput: any;

        try {
          if (functionName === 'checkWalletRunway') {
            toolOutput = await this.transactionsService.calculateQuantMetrics(userId);
          } 
          
          else if (functionName === 'testHypotheticalExpense') {
            const baselines = await this.transactionsService.calculateQuantMetrics(userId);
            
            const wallets = await this.prisma.wallet.findMany({ where: { userId, isActive: true } });
            const currentTotalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
            
            const experimentalBalance = currentTotalBalance - functionArgs.expenseAmount;

            const response = await fetch('http://127.0.0.1:8000/analytics/simulate-runway', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                initial_balance: experimentalBalance,
                drift_mu: baselines.driftMu,
                volatility_sigma: baselines.volatilitySigma,
                days_to_drop: Math.max(1, 14 - (baselines.expectedDepletionDay || 0)),
                current_day_of_cycle: 5, 
                current_day_of_week: new Date().getDay(),
              }),
            });
            
            const simResult = await response.json();
            toolOutput = {
              newSurvivalProbability: simResult.survival_probability,
              newRiskStatus: simResult.risk_status,
              expenseTested: functionArgs.expenseAmount,
              impactMessage: simResult.survival_probability < baselines.survivalProbability 
                ? 'Runway security degrades under this choice.' 
                : 'Your current balance buffer absorbs this cost safely.',
            };
          } 
          
          else if (functionName === 'logImmediateExpense') {
            const activeWallet = await this.prisma.wallet.findFirst({ where: { userId, isActive: true } });
            const currentCycle = await this.prisma.allowanceCycle.findFirst({
              where: { userId },
              orderBy: { endDate: 'desc' },
            });

            if (!activeWallet || !currentCycle) {
              toolOutput = { error: 'No active transaction ledger endpoints found to link item.' };
            } else {
              const newTx = await this.prisma.transaction.create({
                data: {
                  userId,
                  walletId: activeWallet.id,
                  cycleId: currentCycle.id,
                  amount: -Math.abs(functionArgs.amount),
                  category: functionArgs.category,
                  merchant: functionArgs.merchant || 'Unspecified Vendor',
                },
              });

              await this.prisma.wallet.update({
                where: { id: activeWallet.id },
                data: { balance: { decrement: Math.abs(functionArgs.amount) } },
              });

              toolOutput = { status: 'SUCCESS', transactionId: newTx.id, message: 'Expense written directly to core balance infrastructure.' };
            }
          }
        } catch (err) {
          toolOutput = { error: `Internal tool step failure: ${err.message}` };
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: functionName,
          content: JSON.stringify(toolOutput),
        });
      }

      loopLimit++;
    }

    throw new Error('Agent execution cycle exceeded loop boundaries.');
  }
}