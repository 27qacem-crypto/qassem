import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { AccountType, AccountNature } from '@prisma/client';

export class CreateAccountDto {
  @IsString()
  code: string;

  @IsString()
  nameAr: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsEnum(AccountNature)
  nature: AccountNature;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  level?: number;

  @IsOptional()
  @IsBoolean()
  isDetail?: boolean;

  @IsOptional()
  @IsBoolean()
  allowManualEntry?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
