import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VoucherType, VoucherStatus } from '@prisma/client';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('السندات - Vouchers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vouchers')
export class VouchersController {
  constructor(private service: VouchersService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء سند (قبض/صرف)' })
  create(@Body() dto: CreateVoucherDto, @CurrentUser('companyId') companyId: string, @CurrentUser('id') userId: string) {
    return this.service.create(dto, companyId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'عرض كل السندات' })
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query('type') type?: VoucherType,
    @Query('status') status?: VoucherStatus,
    @Query('cashRegisterId') cashRegisterId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.findAll(companyId, { type, status, cashRegisterId, fromDate, toDate });
  }

  @Get(':id')
  @ApiOperation({ summary: 'عرض سند معين' })
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.service.findOne(id, companyId);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'اعتماد سند' })
  approve(@Param('id') id: string, @CurrentUser('companyId') companyId: string, @CurrentUser('id') userId: string) {
    return this.service.approve(id, companyId, userId);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'رفض سند' })
  reject(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.service.reject(id, companyId);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'إلغاء سند' })
  cancel(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.service.cancel(id, companyId);
  }
}
