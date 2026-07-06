import { IsDate, IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDailyClosureDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNumber()
  actualBalance: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  cashRegisterId: string;
}
