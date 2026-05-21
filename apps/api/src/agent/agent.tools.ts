import { ChatCompletionTool } from 'openai/resources';

export const AGENT_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'checkWalletRunway',
      description: 'Retrieves the user\'s current total wallet balance, daily spending pace, spending unpredictability, and current runway success rate.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'testHypotheticalExpense',
      description: 'Runs a predictive simulation to see how a potential large purchase (shock) will impact the user\'s runway success percentage.',
      parameters: {
        type: 'object',
        properties: {
          expenseAmount: {
            type: 'number',
            description: 'The cost of the item the user wants to buy in PHP (₱).',
          },
        },
        required: ['expenseAmount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'logImmediateExpense',
      description: 'Instantly logs a new expense transaction into the user\'s ledger database.',
      parameters: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'The exact absolute cost of the expense in PHP (₱). Will be saved as a negative number automatically.',
          },
          category: {
            type: 'string',
            description: 'The transaction category assignment.',
            enum: ['FOOD', 'COMMUTE', 'DORM', 'SCHOOL', 'ADJUSTMENT'],
          },
          merchant: {
            type: 'string',
            description: 'The name of the establishment or store (e.g., "7-Eleven", "Dorm Landlord").',
          },
        },
        required: ['amount', 'category'],
      },
    },
  },
];