import { IsString, IsDate, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class JournalLineDto {
  @IsString()
  accountId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  debit: number;

  @IsNumber()
  @Min(0)
  credit: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateJournalEntryDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  sourceModule?: string;

  @IsOptional()
  @IsString()
  sourceId?: string;
}
