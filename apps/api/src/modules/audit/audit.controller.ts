import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('سجل التدقيق - Audit Log')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'سجل التدقيق' })
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.findAll(companyId, { module, action });
  }
}
