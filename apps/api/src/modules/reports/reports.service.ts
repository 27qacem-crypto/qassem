import { Injectable } from '@nestjs/common';
import { PrismaService, AccountType, AccountNature } from '@erp/database';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getTrialBalance(companyId: string, fromDate?: string, toDate?: string) {
    const accounts = await this.prisma.account.findMany({
      where: { companyId, isActive: true, isDetail: true },
      include: {
        openingBalances: {
          where: { fiscalYear: new Date().getFullYear() },
        },
      },
      orderBy: { code: 'asc' },
    });

    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);

    const result: Array<{
      code: string;
      nameAr: string;
      openingDebit: number;
      openingCredit: number;
      debit: number;
      credit: number;
      closingDebit: number;
      closingCredit: number;
    }> = [];

    for (const account of accounts) {
      const lines = await this.prisma.journalLine.findMany({
        where: {
          accountId: account.id,
          entry: {
            companyId,
            status: 'POSTED',
            ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
          },
        },
      });

      const opening = account.openingBalances[0];
      const openingDebit = opening?.debit.toNumber() || 0;
      const openingCredit = opening?.credit.toNumber() || 0;

      const periodDebit = lines.reduce((sum, l) => sum + l.debit.toNumber(), 0);
      const periodCredit = lines.reduce((sum, l) => sum + l.credit.toNumber(), 0);

      const totalDebit = openingDebit + periodDebit;
      const totalCredit = openingCredit + periodCredit;

      let closingDebit = 0;
      let closingCredit = 0;

      if (account.nature === AccountNature.DEBIT) {
        if (totalDebit >= totalCredit) {
          closingDebit = totalDebit - totalCredit;
        } else {
          closingCredit = totalCredit - totalDebit;
        }
      } else {
        if (totalCredit >= totalDebit) {
          closingCredit = totalCredit - totalDebit;
        } else {
          closingDebit = totalDebit - totalCredit;
        }
      }

      if (totalDebit > 0 || totalCredit > 0) {
        result.push({
          code: account.code,
          nameAr: account.nameAr,
          openingDebit,
          openingCredit,
          debit: periodDebit,
          credit: periodCredit,
          closingDebit,
          closingCredit,
        });
      }
    }

    return {
      data: result,
      totals: {
        openingDebit: result.reduce((s, r) => s + r.openingDebit, 0),
        openingCredit: result.reduce((s, r) => s + r.openingCredit, 0),
        debit: result.reduce((s, r) => s + r.debit, 0),
        credit: result.reduce((s, r) => s + r.credit, 0),
        closingDebit: result.reduce((s, r) => s + r.closingDebit, 0),
        closingCredit: result.reduce((s, r) => s + r.closingCredit, 0),
      },
    };
  }

  async getIncomeStatement(companyId: string, fromDate?: string, toDate?: string) {
    const accounts = await this.prisma.account.findMany({
      where: {
        companyId,
        isActive: true,
        isDetail: true,
        type: { in: [AccountType.REVENUE, AccountType.EXPENSE] },
      },
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });

    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);

    const revenues: Array<{ code: string; nameAr: string; amount: number }> = [];
    const expenses: Array<{ code: string; nameAr: string; amount: number }> = [];
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const account of accounts) {
      const lines = await this.prisma.journalLine.findMany({
        where: {
          accountId: account.id,
          entry: {
            companyId,
            status: 'POSTED',
            ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
          },
        },
      });

      const amount = lines.reduce((sum, l) => {
        if (account.type === AccountType.REVENUE) {
          return sum + l.credit.toNumber() - l.debit.toNumber();
        }
        return sum + l.debit.toNumber() - l.credit.toNumber();
      }, 0);

      if (amount !== 0) {
        if (account.type === AccountType.REVENUE) {
          revenues.push({ code: account.code, nameAr: account.nameAr, amount });
          totalRevenue += amount;
        } else {
          expenses.push({ code: account.code, nameAr: account.nameAr, amount });
          totalExpenses += amount;
        }
      }
    }

    const netIncome = totalRevenue - totalExpenses;

    return {
      revenues,
      expenses,
      totals: { totalRevenue, totalExpenses, netIncome },
    };
  }

  async getBalanceSheet(companyId: string, asOfDate?: string) {
    const accounts = await this.prisma.account.findMany({
      where: {
        companyId,
        isActive: true,
        isDetail: true,
        type: { in: [AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY] },
      },
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });

    const dateFilter: any = {};
    if (asOfDate) dateFilter.lte = new Date(asOfDate);

    const assets: Array<{ code: string; nameAr: string; balance: number }> = [];
    const liabilities: Array<{ code: string; nameAr: string; balance: number }> = [];
    const equity: Array<{ code: string; nameAr: string; balance: number }> = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const account of accounts) {
      const lines = await this.prisma.journalLine.findMany({
        where: {
          accountId: account.id,
          entry: {
            companyId,
            status: 'POSTED',
            ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
          },
        },
      });

      const opening = await this.prisma.openingBalance.findFirst({
        where: { accountId: account.id, fiscalYear: new Date().getFullYear() },
      });

      const openingDebit = opening?.debit.toNumber() || 0;
      const openingCredit = opening?.credit.toNumber() || 0;
      const periodDebit = lines.reduce((sum, l) => sum + l.debit.toNumber(), 0);
      const periodCredit = lines.reduce((sum, l) => sum + l.credit.toNumber(), 0);

      const totalDebit = openingDebit + periodDebit;
      const totalCredit = openingCredit + periodCredit;

      let balance = 0;
      if (account.nature === AccountNature.DEBIT) {
        balance = totalDebit - totalCredit;
      } else {
        balance = totalCredit - totalDebit;
      }

      if (balance !== 0) {
        const entry = { code: account.code, nameAr: account.nameAr, balance: Math.abs(balance) };

        switch (account.type) {
          case AccountType.ASSET:
            assets.push(entry);
            totalAssets += Math.abs(balance);
            break;
          case AccountType.LIABILITY:
            liabilities.push(entry);
            totalLiabilities += Math.abs(balance);
            break;
          case AccountType.EQUITY:
            equity.push(entry);
            totalEquity += Math.abs(balance);
            break;
        }
      }
    }

    return {
      assets,
      liabilities,
      equity,
      totals: { totalAssets, totalLiabilities, totalEquity },
    };
  }

  async getAccountStatement(accountId: string, companyId: string, fromDate?: string, toDate?: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
    });

    if (!account) {
      throw new Error('الحساب غير موجود');
    }

    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);

    const opening = await this.prisma.openingBalance.findFirst({
      where: { accountId, fiscalYear: new Date().getFullYear() },
    });

    const lines = await this.prisma.journalLine.findMany({
      where: {
        accountId,
        entry: {
          companyId,
          status: 'POSTED',
          ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
        },
      },
      include: {
        entry: {
          select: { entryNumber: true, date: true, description: true },
        },
      },
      orderBy: [{ entry: { date: 'asc' } }, { sortOrder: 'asc' }],
    });

    const openingBalance = (opening?.debit.toNumber() || 0) - (opening?.credit.toNumber() || 0);

    return {
      account: { code: account.code, nameAr: account.nameAr },
      openingBalance,
      lines: lines.map((l) => ({
        date: l.entry.date,
        entryNumber: l.entry.entryNumber,
        description: l.description || l.entry.description,
        debit: l.debit.toNumber(),
        credit: l.credit.toNumber(),
      })),
    };
  }
}
