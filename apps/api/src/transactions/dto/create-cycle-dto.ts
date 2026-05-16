export class CreateCycleDto {
  userId: string;
  amount: number;
  cadence: 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY';
  startDate: string;
}