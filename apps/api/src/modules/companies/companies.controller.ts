import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('الشركة - Company')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('company')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'بيانات الشركة' })
  getProfile(@CurrentUser('companyId') companyId: string) {
    return this.companiesService.getProfile(companyId);
  }

  @Put()
  @ApiOperation({ summary: 'تحديث بيانات الشركة' })
  update(@CurrentUser('companyId') companyId: string, @Body() body: any) {
    return this.companiesService.update(companyId, body);
  }

  @Get('branches')
  @ApiOperation({ summary: 'عرض الفروع' })
  getBranches(@CurrentUser('companyId') companyId: string) {
    return this.companiesService.getBranches(companyId);
  }

  @Post('branches')
  @ApiOperation({ summary: 'إنشاء فرع جديد' })
  createBranch(@CurrentUser('companyId') companyId: string, @Body() body: any) {
    return this.companiesService.createBranch(companyId, body);
  }
}
