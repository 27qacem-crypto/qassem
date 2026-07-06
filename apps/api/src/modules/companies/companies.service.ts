import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@erp/database';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async getProfile(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        branches: { where: { isActive: true } },
      },
    });
    if (!company) throw new NotFoundException('الشركة غير موجودة');
    return company;
  }

  async update(companyId: string, data: any) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('الشركة غير موجودة');

    return this.prisma.company.update({
      where: { id: companyId },
      data,
    });
  }

  async getBranches(companyId: string) {
    return this.prisma.branch.findMany({
      where: { companyId, isActive: true },
    });
  }

  async createBranch(companyId: string, data: { nameAr: string; nameEn?: string; address?: string }) {
    return this.prisma.branch.create({
      data: { ...data, companyId },
    });
  }
}
