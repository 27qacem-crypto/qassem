import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService, UserRole, Prisma } from '@erp/database';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    email: string;
    password: string;
    nameAr: string;
    nameEn?: string;
    phone?: string;
    role?: UserRole;
    companyId: string;
    branchId?: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('البريد الإلكتروني موجود بالفعل');

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        phone: data.phone,
        role: data.role || UserRole.VIEWER,
        companyId: data.companyId,
        branchId: data.branchId,
      },
      select: {
        id: true,
        email: true,
        nameAr: true,
        nameEn: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        nameAr: true,
        nameEn: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        email: true,
        nameAr: true,
        nameEn: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        branchId: true,
        permissions: {
          include: { permission: true },
        },
      },
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return user;
  }

  async update(id: string, data: any, companyId: string) {
    await this.findOne(id, companyId);

    if (data.password) {
      data.passwordHash = await bcrypt.hash(data.password, 10);
      delete data.password;
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        nameAr: true,
        nameEn: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
