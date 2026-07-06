import { Injectable } from '@nestjs/common';
import { PrismaService, Prisma } from '@erp/database';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    userId: string;
    action: string;
    module: string;
    entityId?: string;
    entityType?: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
    userAgent?: string;
    companyId: string;
  }) {
    return this.prisma.auditLog.create({ data: data as any });
  }

  async findAll(companyId: string, filter?: { module?: string; action?: string; userId?: string }) {
    const where: Prisma.AuditLogWhereInput = { companyId };
    if (filter?.module) where.module = filter.module;
    if (filter?.action) where.action = filter.action;
    if (filter?.userId) where.userId = filter.userId;

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, nameAr: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
