import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('التقارير المالية - Financial Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('trial-balance')
  @ApiOperation({ summary: 'ميزان المراجعة' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  getTrialBalance(
    @CurrentUser('companyId') companyId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.reportsService.getTrialBalance(companyId, fromDate, toDate);
  }

  @Get('income-statement')
  @ApiOperation({ summary: 'قائمة الدخل' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  getIncomeStatement(
    @CurrentUser('companyId') companyId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.reportsService.getIncomeStatement(companyId, fromDate, toDate);
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'الميزانية العمومية' })
  @ApiQuery({ name: 'asOfDate', required: false })
  getBalanceSheet(
    @CurrentUser('companyId') companyId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.reportsService.getBalanceSheet(companyId, asOfDate);
  }

  @Get('account-statement/:accountId')
  @ApiOperation({ summary: 'كشف حساب لحساب معين' })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  getAccountStatement(
    @Param('accountId') accountId: string,
    @CurrentUser('companyId') companyId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.reportsService.getAccountStatement(accountId, companyId, fromDate, toDate);
  }
}
