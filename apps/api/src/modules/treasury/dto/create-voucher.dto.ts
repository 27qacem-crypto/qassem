import { IsString, IsDate, IsNumber, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { VoucherType } from '@prisma/client';

export class CreateVoucherDto {
  @IsEnum(VoucherType)
  type: VoucherType;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'EGP';

  @IsOptional()
  @IsNumber()
  exchangeRate?: number = 1;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  payeePayerName?: string;

  @IsOptional()
  @IsString()
  payeePayerType?: string;

  @IsOptional()
  @IsString()
  payeePayerId?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  cashRegisterId: string;

  @IsString()
  accountId: string;

  @IsOptional()
  @IsNumber()
  feeAmount?: number = 0;

  @IsOptional()
  @IsString()
  feeAccountId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsBoolean()
  autoPost?: boolean = true;
}
