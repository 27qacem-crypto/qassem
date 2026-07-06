import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@erp/database';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('غير مصرح بالوصول');

    if (user.role === 'SUPER_ADMIN') return true;

    for (const perm of requiredPermissions) {
      const userPerm = await this.prisma.userPermission.findFirst({
        where: {
          userId: user.id,
          permission: { code: perm },
        },
      });

      if (!userPerm?.granted) {
        const rolePerm = await this.prisma.rolePermission.findFirst({
          where: {
            role: user.role,
            permission: { code: perm },
          },
        });
        if (!rolePerm) {
          throw new ForbiddenException(`ليس لديك صلاحية: ${perm}`);
        }
      }
    }
    return true;
  }
}
