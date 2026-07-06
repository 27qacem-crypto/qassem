import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@erp/database';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('هذا الحساب غير نشط، الرجاء التواصل مع الإدارة');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateAuthResponse(user);
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');
    }

    const company = await this.prisma.company.findFirst();
    if (!company) {
      throw new UnauthorizedException('لا توجد شركة افتراضية، الرجاء الاتصال بالدعم');
    }

    const branch = await this.prisma.branch.findFirst({
      where: { companyId: company.id, isMain: true },
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        phone: dto.phone,
        role: dto.role || 'VIEWER',
        companyId: company.id,
        branchId: branch?.id,
      },
    });

    return this.generateAuthResponse(user);
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nameAr: true,
        nameEn: true,
        phone: true,
        role: true,
        isActive: true,
        companyId: true,
        branchId: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  private generateAuthResponse(user: any): AuthResponseDto {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      id: user.id,
      email: user.email,
      nameAr: user.nameAr,
      nameEn: user.nameEn,
      role: user.role,
      companyId: user.companyId,
      branchId: user.branchId,
      token: this.jwtService.sign(payload),
    };
  }
}
