import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateCycleDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  cadence: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsNumber()
  @IsOptional()
  initialWalletBalance?: number;

  @IsString()
  @IsNotEmpty()
  userId: string;
}