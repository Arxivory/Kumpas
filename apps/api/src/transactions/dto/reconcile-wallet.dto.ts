import { IsNumber, IsNotEmpty } from 'class-validator';

export class ReconcileWalletDto {
  @IsNumber()
  @IsNotEmpty()
  newBalance: number;
}