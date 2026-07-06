import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService, Prisma, AccountType, AccountNature } from '@erp/database';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountTreeNode } from './dto/account-tree.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAccountDto, companyId: string) {
    const existing = await this.prisma.account.findUnique({
      where: { code_companyId: { code: dto.code, companyId } },
    });
    if (existing) {
      throw new BadRequestException(`كود الحساب ${dto.code} موجود بالفعل`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.account.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('الحساب الأب غير موجود');
      }
      if (parent.isDetail) {
        throw new BadRequestException('لا يمكن إضافة حساب فرعي لحساب تفصيلي');
      }
    }

    const level = dto.level || (dto.parentId ? undefined : 1);

    return this.prisma.account.create({
      data: {
        code: dto.code,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        type: dto.type,
        nature: dto.nature,
        parentId: dto.parentId || null,
        level: level || 1,
        isDetail: dto.isDetail ?? true,
        allowManualEntry: dto.allowManualEntry ?? true,
        description: dto.description,
        companyId,
      },
    });
  }

  async findAll(companyId: string, type?: AccountType) {
    const where: Prisma.AccountWhereInput = { companyId };
    if (type) where.type = type;

    return this.prisma.account.findMany({
      where,
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, companyId },
      include: {
        parent: true,
        children: { orderBy: { code: 'asc' } },
      },
    });

    if (!account) {
      throw new NotFoundException('الحساب غير موجود');
    }

    return account;
  }

  async update(id: string, dto: UpdateAccountDto, companyId: string) {
    const account = await this.findOne(id, companyId);

    if (dto.code && dto.code !== account.code) {
      const existing = await this.prisma.account.findUnique({
        where: { code_companyId: { code: dto.code, companyId } },
      });
      if (existing) {
        throw new BadRequestException(`كود الحساب ${dto.code} موجود بالفعل`);
      }
    }

    return this.prisma.account.update({
      where: { id },
      data: {
        ...dto,
        parentId: dto.parentId ?? account.parentId,
      },
    });
  }

  async remove(id: string, companyId: string) {
    const account = await this.findOne(id, companyId);

    const childrenCount = await this.prisma.account.count({
      where: { parentId: id },
    });
    if (childrenCount > 0) {
      throw new BadRequestException('لا يمكن حذف حساب لديه حسابات فرعية');
    }

    const journalLines = await this.prisma.journalLine.count({
      where: { accountId: id },
    });
    if (journalLines > 0) {
      throw new BadRequestException('لا يمكن حذف حساب مستخدم في قيود اليومية');
    }

    return this.prisma.account.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getTree(companyId: string): Promise<AccountTreeNode[]> {
    const accounts = await this.prisma.account.findMany({
      where: { companyId, isActive: true },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    });

    return this.buildTree(accounts);
  }

  private buildTree(accounts: any[]): AccountTreeNode[] {
    const map = new Map<string, AccountTreeNode>();
    const roots: AccountTreeNode[] = [];

    for (const acc of accounts) {
      map.set(acc.id, {
        id: acc.id,
        code: acc.code,
        nameAr: acc.nameAr,
        nameEn: acc.nameEn || undefined,
        type: acc.type,
        nature: acc.nature,
        level: acc.level,
        isDetail: acc.isDetail,
        isActive: acc.isActive,
        children: [],
      });
    }

    for (const acc of accounts) {
      const node = map.get(acc.id);
      if (acc.parentId && map.has(acc.parentId)) {
        map.get(acc.parentId)!.children.push(node!);
      } else if (!acc.parentId) {
        roots.push(node!);
      }
    }

    return roots;
  }

  async getBalances(companyId: string, fromDate?: Date, toDate?: Date) {
    const accounts = await this.prisma.account.findMany({
      where: { companyId, isActive: true, isDetail: true },
      include: {
        openingBalances: {
          where: { fiscalYear: new Date().getFullYear() },
        },
      },
    });

    const balances: Record<string, { debit: number; credit: number; balance: number }> = {};
    const dateFilter: any = {};

    if (fromDate || toDate) {
      dateFilter.date = {};
      if (fromDate) dateFilter.date.gte = fromDate;
      if (toDate) dateFilter.date.lte = toDate;
    }

    for (const account of accounts) {
      const lines = await this.prisma.journalLine.findMany({
        where: {
          accountId: account.id,
          entry: {
            companyId,
            status: 'POSTED',
            ...dateFilter,
          },
        },
      });

      const opening = account.openingBalances[0];
      const openingDebit = opening?.debit.toNumber() || 0;
      const openingCredit = opening?.credit.toNumber() || 0;

      const totalDebit = lines.reduce((sum, l) => sum + l.debit.toNumber(), 0) + openingDebit;
      const totalCredit = lines.reduce((sum, l) => sum + l.credit.toNumber(), 0) + openingCredit;

      let balance = account.nature === AccountNature.DEBIT
        ? totalDebit - totalCredit
        : totalCredit - totalDebit;

      balances[account.id] = { debit: totalDebit, credit: totalCredit, balance };
    }

    return balances;
  }
}
