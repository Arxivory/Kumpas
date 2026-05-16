export class CreateManualTransactionDto {
  userId: string;
  amount: number;
  category: 'FOOD' | 'COMMUTE' | 'DORM' | 'SCHOOL' | 'ADJUSTMENT' | 'ALLOWANCE';
  merchant?: string;
}