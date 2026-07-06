import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@erp/database';
import { CreateDailyClosureDto } from './dto/create-daily-closure.dto';

@Injectable()
export class DailyClosuresService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDailyClosureDto, companyId: string, userId: string) {
    const cashRegister = await this.prisma.cashRegister.findFirst({
      where: { id: dto.cashRegisterId, companyId },
    });
    if (!cashRegister) throw new NotFoundException('الخزينة غير موجودة');

    const existing = await this.prisma.dailyClosure.findFirst({
      where: { cashRegisterId: dto.cashRegisterId, date: dto.date },
    });
    if (existing) {
      throw new BadRequestException('تم تقفيل هذا التاريخ مسبقاً');
    }

    const vouchers = await this.prisma.voucher.findMany({
      where: {
        cashRegisterId: dto.cashRegisterId,
        date: dto.date,
        status: 'APPROVED',
      },
    });

    const totalIn = vouchers
      .filter((v) => ['CASH_IN', 'BANK_DEPOSIT', 'VODAFONE_DEPOSIT'].includes(v.type))
      .reduce((sum, v) => sum + v.amountBase.toNumber(), 0);

    const totalOut = vouchers
      .filter((v) => ['CASH_OUT', 'BANK_WITHDRAWAL', 'VODAFONE_WITHDRAWAL'].includes(v.type))
      .reduce((sum, v) => sum + v.amountBase.toNumber(), 0);

    const openingBalance = cashRegister.currentBalance.toNumber() - totalIn + totalOut;
    const expectedBalance = openingBalance + totalIn - totalOut;
    const variance = dto.actualBalance - expectedBalance;

    return this.prisma.dailyClosure.create({
      data: {
        date: dto.date,
        openingBalance,
        totalIn,
        totalOut,
        expectedBalance,
        actualBalance: dto.actualBalance,
        variance,
        notes: dto.notes,
        cashRegisterId: dto.cashRegisterId,
        closedById: userId,
        companyId,
      },
    });
  }

  async findAll(companyId: string, cashRegisterId?: string) {
    const where: any = { companyId };
    if (cashRegisterId) where.cashRegisterId = cashRegisterId;

    return this.prisma.dailyClosure.findMany({
      where,
      include: {
        cashRegister: { select: { id: true, nameAr: true } },
        closedBy: { select: { id: true, nameAr: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getRegisterStatement(cashRegisterId: string, companyId: string, fromDate?: string, toDate?: string) {
    const cr = await this.prisma.cashRegister.findFirst({
      where: { id: cashRegisterId, companyId },
    });
    if (!cr) throw new NotFoundException('الخزينة غير موجودة');

    const where: any = {
      cashRegisterId,
      status: 'APPROVED',
    };
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) where.date.lte = new Date(toDate);
    }

    const vouchers = await this.prisma.voucher.findMany({
      where,
      include: {
        account: { select: { id: true, code: true, nameAr: true } },
        createdBy: { select: { nameAr: true } },
      },
      orderBy: { date: 'asc' },
    });

    let runningBalance = cr.openingBalance.toNumber();
    const statement = vouchers.map((v) => {
      const amount = v.amountBase.toNumber();
      const isIn = ['CASH_IN', 'BANK_DEPOSIT', 'VODAFONE_DEPOSIT'].includes(v.type);
      runningBalance += isIn ? amount : -amount;

      return {
        date: v.date,
        voucherNumber: v.voucherNumber,
        description: v.description,
        type: v.type,
        payeePayerName: v.payeePayerName,
        inAmount: isIn ? amount : 0,
        outAmount: isIn ? 0 : amount,
        balance: runningBalance,
        createdBy: v.createdBy?.nameAr,
      };
    });

    return {
      cashRegister: { nameAr: cr.nameAr, openingBalance: cr.openingBalance.toNumber() },
      statement,
    };
  }
}
