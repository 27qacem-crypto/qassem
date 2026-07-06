import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@erp/database';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';

@Injectable()
export class CashRegistersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCashRegisterDto, companyId: string) {
    return this.prisma.cashRegister.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        currency: dto.currency || 'EGP',
        openingBalance: dto.openingBalance || 0,
        currentBalance: dto.openingBalance || 0,
        accountId: dto.accountId,
        branchId: dto.branchId,
        companyId,
        isMain: dto.isMain || false,
      },
    });
  }

  async findAll(companyId: string, branchId?: string) {
    const where: any = { companyId };
    if (branchId) where.branchId = branchId;

    return this.prisma.cashRegister.findMany({
      where,
      include: { branch: { select: { id: true, nameAr: true } } },
      orderBy: { nameAr: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const cr = await this.prisma.cashRegister.findFirst({
      where: { id, companyId },
      include: {
        branch: { select: { id: true, nameAr: true } },
        account: { select: { id: true, code: true, nameAr: true } },
      },
    });
    if (!cr) throw new NotFoundException('الخزينة غير موجودة');
    return cr;
  }

  async updateBalance(id: string, companyId: string) {
    const cr = await this.findOne(id, companyId);

    const vouchers = await this.prisma.voucher.findMany({
      where: {
        cashRegisterId: id,
        status: 'APPROVED',
      },
    });

    const totalIn = vouchers
      .filter((v) => ['CASH_IN', 'BANK_DEPOSIT', 'VODAFONE_DEPOSIT'].includes(v.type))
      .reduce((sum, v) => sum + v.amountBase.toNumber(), 0);

    const totalOut = vouchers
      .filter((v) => ['CASH_OUT', 'BANK_WITHDRAWAL', 'VODAFONE_WITHDRAWAL'].includes(v.type))
      .reduce((sum, v) => sum + v.amountBase.toNumber(), 0);

    const currentBalance = cr.openingBalance.toNumber() + totalIn - totalOut;

    return this.prisma.cashRegister.update({
      where: { id },
      data: { currentBalance },
    });
  }
}
