import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService, VoucherType, VoucherStatus, JournalEntryStatus } from '@erp/database';
import { CreateVoucherDto } from './dto/create-voucher.dto';

@Injectable()
export class VouchersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVoucherDto, companyId: string, userId: string) {
    const cashRegister = await this.prisma.cashRegister.findFirst({
      where: { id: dto.cashRegisterId, companyId },
    });
    if (!cashRegister) throw new NotFoundException('الخزينة غير موجودة');

    const amountBase = dto.amount * (dto.exchangeRate || 1);
    const voucherNumber = await this.generateVoucherNumber(dto.type, companyId);

    const voucher = await this.prisma.voucher.create({
      data: {
        voucherNumber,
        type: dto.type,
        date: dto.date,
        amount: dto.amount,
        currency: dto.currency || 'EGP',
        exchangeRate: dto.exchangeRate || 1,
        amountBase,
        description: dto.description,
        status: VoucherStatus.PENDING,
        payeePayerName: dto.payeePayerName,
        payeePayerType: dto.payeePayerType,
        payeePayerId: dto.payeePayerId,
        reference: dto.reference,
        notes: dto.notes,
        cashRegisterId: dto.cashRegisterId,
        accountId: dto.accountId,
        feeAmount: dto.feeAmount || 0,
        feeAccountId: dto.feeAccountId,
        createdById: userId,
        companyId,
        branchId: dto.branchId,
      },
    });

    if (dto.autoPost) {
      return this.approve(voucher.id, companyId, userId);
    }

    return voucher;
  }

  async approve(id: string, companyId: string, userId: string) {
    const voucher = await this.findOne(id, companyId);
    if (voucher.status !== VoucherStatus.PENDING) {
      throw new BadRequestException('يمكن اعتماد السندات المعلقة فقط');
    }

    // Create journal entry automatically
    const entry = await this.createJournalEntryForVoucher(voucher, companyId, userId);

    const approved = await this.prisma.voucher.update({
      where: { id },
      data: {
        status: VoucherStatus.APPROVED,
        approvedById: userId,
        approvedAt: new Date(),
        journalEntryId: entry.id,
      },
      include: {
        cashRegister: true,
        account: true,
        journalEntry: {
          include: { lines: { include: { account: true } } },
        },
      },
    });

    // Update cash register balance
    await this.updateCashRegisterBalance(voucher.cashRegisterId);

    return approved;
  }

  async reject(id: string, companyId: string) {
    const voucher = await this.findOne(id, companyId);
    if (voucher.status !== VoucherStatus.PENDING) {
      throw new BadRequestException('يمكن رفض السندات المعلقة فقط');
    }

    return this.prisma.voucher.update({
      where: { id },
      data: { status: VoucherStatus.REJECTED },
    });
  }

  async cancel(id: string, companyId: string) {
    const voucher = await this.findOne(id, companyId);
    if (voucher.status === VoucherStatus.CANCELLED) {
      throw new BadRequestException('السند ملغي بالفعل');
    }

    if (voucher.status === VoucherStatus.APPROVED && voucher.journalEntryId) {
      // Reverse the journal entry if it was posted
      const entry = await this.prisma.journalEntry.findUnique({
        where: { id: voucher.journalEntryId },
        include: { lines: true },
      });

      if (entry && entry.status === JournalEntryStatus.POSTED) {
        await this.prisma.journalEntry.update({
          where: { id: entry.id },
          data: { status: JournalEntryStatus.REVERSED },
        });
      }
    }

    return this.prisma.voucher.update({
      where: { id },
      data: { status: VoucherStatus.CANCELLED },
    });
  }

  async findAll(companyId: string, filter?: { type?: VoucherType; status?: VoucherStatus; cashRegisterId?: string; fromDate?: string; toDate?: string }) {
    const where: any = { companyId };

    if (filter?.type) where.type = filter.type;
    if (filter?.status) where.status = filter.status;
    if (filter?.cashRegisterId) where.cashRegisterId = filter.cashRegisterId;
    if (filter?.fromDate || filter?.toDate) {
      where.date = {};
      if (filter.fromDate) where.date.gte = new Date(filter.fromDate);
      if (filter.toDate) where.date.lte = new Date(filter.toDate);
    }

    return this.prisma.voucher.findMany({
      where,
      include: {
        cashRegister: { select: { id: true, nameAr: true } },
        account: { select: { id: true, code: true, nameAr: true } },
        createdBy: { select: { id: true, nameAr: true } },
        approvedBy: { select: { id: true, nameAr: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const voucher = await this.prisma.voucher.findFirst({
      where: { id, companyId },
      include: {
        cashRegister: { select: { id: true, nameAr: true, currentBalance: true } },
        account: { select: { id: true, code: true, nameAr: true } },
        feeAccount: { select: { id: true, code: true, nameAr: true } },
        createdBy: { select: { id: true, nameAr: true } },
        approvedBy: { select: { id: true, nameAr: true } },
        journalEntry: {
          include: { lines: { include: { account: true } } },
        },
      },
    });
    if (!voucher) throw new NotFoundException('السند غير موجود');
    return voucher;
  }

  private async createJournalEntryForVoucher(voucher: any, companyId: string, userId: string) {
    const lines: Array<{ accountId: string; description: string; debit: number; credit: number }> = [];

    const isInflow = ['CASH_IN', 'BANK_DEPOSIT', 'VODAFONE_DEPOSIT'].includes(voucher.type);
    const isOutflow = ['CASH_OUT', 'BANK_WITHDRAWAL', 'VODAFONE_WITHDRAWAL'].includes(voucher.type);

    // Line 1: Cash Register (debit for inflow, credit for outflow)
    lines.push({
      accountId: voucher.cashRegister.accountId,
      description: voucher.description,
      debit: isInflow ? voucher.amountBase.toNumber() : 0,
      credit: isOutflow ? voucher.amountBase.toNumber() : 0,
    });

    // Line 2: Counter account (reverse)
    lines.push({
      accountId: voucher.accountId,
      description: voucher.description,
      debit: isOutflow ? voucher.amountBase.toNumber() : 0,
      credit: isInflow ? voucher.amountBase.toNumber() : 0,
    });

    // Line 3: Fee account (if any)
    if (voucher.feeAmount?.toNumber() > 0 && voucher.feeAccountId) {
      lines.push({
        accountId: voucher.feeAccountId,
        description: `عمولات: ${voucher.description}`,
        debit: voucher.feeAmount.toNumber(),
        credit: 0,
      });

      // Adjust counter account for fee
      lines[1].debit = isOutflow ? voucher.amountBase.toNumber() + voucher.feeAmount.toNumber() : 0;
      lines[1].credit = isInflow ? voucher.amountBase.toNumber() - voucher.feeAmount.toNumber() : 0;
    }

    const entryNumber = await this.generateEntryNumber(companyId);
    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

    return this.prisma.journalEntry.create({
      data: {
        entryNumber,
        date: voucher.date,
        description: `سند ${this.getArabicVoucherType(voucher.type)}: ${voucher.description}`,
        status: JournalEntryStatus.POSTED,
        totalDebit,
        totalCredit,
        companyId,
        branchId: voucher.branchId,
        createdById: userId,
        postedById: userId,
        postedAt: new Date(),
        isAutoGenerated: true,
        sourceModule: 'treasury',
        sourceId: voucher.id,
        lines: {
          create: lines.map((l, i) => ({
            accountId: l.accountId,
            description: l.description,
            debit: l.debit,
            credit: l.credit,
            sortOrder: i + 1,
          })),
        },
      },
    });
  }

  private async updateCashRegisterBalance(cashRegisterId: string) {
    const cr = await this.prisma.cashRegister.findUnique({ where: { id: cashRegisterId } });
    if (!cr) return;

    const vouchers = await this.prisma.voucher.findMany({
      where: { cashRegisterId, status: 'APPROVED' },
    });

    const totalIn = vouchers
      .filter((v) => ['CASH_IN', 'BANK_DEPOSIT', 'VODAFONE_DEPOSIT'].includes(v.type))
      .reduce((sum, v) => sum + v.amountBase.toNumber(), 0);

    const totalOut = vouchers
      .filter((v) => ['CASH_OUT', 'BANK_WITHDRAWAL', 'VODAFONE_WITHDRAWAL'].includes(v.type))
      .reduce((sum, v) => sum + v.amountBase.toNumber(), 0);

    const currentBalance = cr.openingBalance.toNumber() + totalIn - totalOut;

    await this.prisma.cashRegister.update({
      where: { id: cashRegisterId },
      data: { currentBalance },
    });
  }

  private async generateVoucherNumber(type: VoucherType, companyId: string): Promise<string> {
    const prefixMap: Record<string, string> = {
      CASH_IN: 'CV',
      CASH_OUT: 'PV',
      BANK_DEPOSIT: 'BD',
      BANK_WITHDRAWAL: 'BW',
      CHECK_RECEIVED: 'CR',
      CHECK_ISSUED: 'CI',
      VODAFONE_DEPOSIT: 'VD',
      VODAFONE_WITHDRAWAL: 'VW',
      VODAFONE_TRANSFER: 'VT',
    };
    const prefix = prefixMap[type] || 'VC';
    const year = new Date().getFullYear();

    const last = await this.prisma.voucher.findFirst({
      where: { companyId, type },
      orderBy: { createdAt: 'desc' },
    });

    const nextNum = last ? parseInt(last.voucherNumber.split('-')[2] || '0', 10) + 1 : 1;
    return `${prefix}-${year}-${String(nextNum).padStart(5, '0')}`;
  }

  private async generateEntryNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.journalEntry.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    const nextNum = last ? parseInt(last.entryNumber.split('-')[2] || '0', 10) + 1 : 1;
    return `JE-${year}-${String(nextNum).padStart(5, '0')}`;
  }

  private getArabicVoucherType(type: string): string {
    const map: Record<string, string> = {
      CASH_IN: 'قبض',
      CASH_OUT: 'صرف',
      BANK_DEPOSIT: 'إيداع بنكي',
      BANK_WITHDRAWAL: 'سحب بنكي',
      CHECK_RECEIVED: 'شيك وارد',
      CHECK_ISSUED: 'شيك صادر',
      VODAFONE_DEPOSIT: 'إيداع فودافون كاش',
      VODAFONE_WITHDRAWAL: 'سحب فودافون كاش',
      VODAFONE_TRANSFER: 'تحويل فودافون كاش',
    };
    return map[type] || type;
  }
}
