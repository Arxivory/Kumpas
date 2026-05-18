import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class UpdateCycleDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  endDate: string;
}