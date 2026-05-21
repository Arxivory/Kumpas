import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable()
export class AgentService {
  private ai: GoogleGenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
  ) {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  async processAgentChat(userId: string, incomingMessage: string, history: any[] = []) {
    const geminiHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = `You are Kumpas AI, an intelligent, helpful, and direct financial companion agent for college students. 
    You have direct access to tools that can check their active wallet health, simulate financial shock outcomes using their specific Python machine learning variables, and record expenses.
    Always maintain a supportive peer-to-peer tone. Keep explanations clear and action-focused. 
    When talking about money values, use the Philippine Peso sign (₱). Avoid generic placeholder financial filler advice. Always lean on your actual tool responses.`;

    const tools: any = [
    {
        functionDeclarations: [
        {
            name: 'checkWalletRunway',
            description:
            "Retrieves the user's current total wallet balance, daily spending pace, spending unpredictability, and current runway success rate.",
        },

        {
            name: 'testHypotheticalExpense',
            description:
            "Runs a predictive simulation to see how a potential large purchase (shock) will impact the user's runway success percentage.",

            parameters: {
            type: Type.OBJECT,
            properties: {
                expenseAmount: {
                type: Type.NUMBER,
                description:
                    'The cost of the item the user wants to buy in PHP (₱).',
                },
            },
            required: ['expenseAmount'],
            },
        },

        {
            name: 'logImmediateExpense',
            description:
            "Instantly logs a new expense transaction into the user's ledger database.",

            parameters: {
            type: Type.OBJECT,
            properties: {
                amount: {
                type: Type.NUMBER,
                description:
                    'The exact absolute cost of the expense in PHP (₱). Will be saved as a negative number automatically.',
                },

                category: {
                type: Type.STRING,
                description: 'The transaction category assignment.',
                enum: [
                    'FOOD',
                    'COMMUTE',
                    'DORM',
                    'SCHOOL',
                    'ADJUSTMENT',
                ],
                },

                merchant: {
                type: Type.STRING,
                description:
                    'The name of the establishment or store (e.g., "7-Eleven").',
                },
            },

            required: ['amount', 'category'],
            },
        },
        ],
    },
    ];

    const chatContents = [
      ...geminiHistory,
      { role: 'user', parts: [{ text: incomingMessage }] }
    ];

    let loopLimit = 0;

    while (loopLimit < 4) {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: chatContents,
        config: {
          systemInstruction,
          tools,
        }
      });

      if (response.candidates?.[0]?.content) {
        chatContents.push(response.candidates[0].content as any);
      }

      const functionCalls = response.functionCalls;

      if (!functionCalls || functionCalls.length === 0) {
        const updatedHistory = chatContents.map(c => ({
          role: c.role === 'model' ? 'assistant' : 'user',
          content: c.parts?.[0]?.text || 'Processing background actions...'
        }));

        return {
          answer: response.text,
          updatedHistory,
        };
      }

      for (const call of functionCalls) {
        const functionName = call.name;
        const functionArgs = call.args as any;
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

            const res = await fetch('http://127.0.0.1:8000/analytics/simulate-runway', {
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
            
            const simResult = await res.json();
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

        chatContents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: functionName,
              response: { result: toolOutput }
            }
          }]
        } as any);
      }

      loopLimit++;
    }

    throw new Error('Gemini agent execution cycle exceeded loop boundaries.');
  }
}