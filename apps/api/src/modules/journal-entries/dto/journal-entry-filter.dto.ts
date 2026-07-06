import { IsOptional, IsString, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { JournalEntryStatus } from '@prisma/client';

export class JournalEntryFilterDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fromDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(JournalEntryStatus)
  status?: JournalEntryStatus;

  @IsOptional()
  @IsString()
  accountId?: string;
}
