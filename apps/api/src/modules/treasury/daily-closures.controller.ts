import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DailyClosuresService } from './daily-closures.service';
import { CreateDailyClosureDto } from './dto/create-daily-closure.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('تقفيل اليومية - Daily Closures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('daily-closures')
export class DailyClosuresController {
  constructor(private service: DailyClosuresService) {}

  @Post()
  @ApiOperation({ summary: 'تقفيل يومية' })
  create(@Body() dto: CreateDailyClosureDto, @CurrentUser('companyId') companyId: string, @CurrentUser('id') userId: string) {
    return this.service.create(dto, companyId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'عرض تقفيلات اليومية' })
  findAll(@CurrentUser('companyId') companyId: string, @Query('cashRegisterId') cashRegisterId?: string) {
    return this.service.findAll(companyId, cashRegisterId);
  }

  @Get('statement/:cashRegisterId')
  @ApiOperation({ summary: 'كشف حساب خزينة' })
  getStatement(
    @Param('cashRegisterId') cashRegisterId: string,
    @CurrentUser('companyId') companyId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.getRegisterStatement(cashRegisterId, companyId, fromDate, toDate);
  }
}
