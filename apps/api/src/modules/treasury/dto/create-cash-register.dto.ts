import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateCashRegisterDto {
  @IsString()
  nameAr: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  currency?: string = 'EGP';

  @IsOptional()
  @IsNumber()
  openingBalance?: number = 0;

  @IsString()
  accountId: string;

  @IsString()
  branchId: string;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean = false;
}
