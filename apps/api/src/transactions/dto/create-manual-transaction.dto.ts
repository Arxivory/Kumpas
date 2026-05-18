import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateManualTransactionDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  merchant?: string;

  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}