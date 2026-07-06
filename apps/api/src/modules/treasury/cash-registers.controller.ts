import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CashRegistersService } from './cash-registers.service';
import { CreateCashRegisterDto } from './dto/create-cash-register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('الخزينة - Cash Registers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cash-registers')
export class CashRegistersController {
  constructor(private service: CashRegistersService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء خزينة جديدة' })
  create(@Body() dto: CreateCashRegisterDto, @CurrentUser('companyId') companyId: string) {
    return this.service.create(dto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'عرض كل الخزائن' })
  findAll(@CurrentUser('companyId') companyId: string, @Query('branchId') branchId?: string) {
    return this.service.findAll(companyId, branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'عرض خزينة معينة' })
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.service.findOne(id, companyId);
  }

  @Post(':id/update-balance')
  @ApiOperation({ summary: 'تحديث رصيد الخزينة' })
  updateBalance(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.service.updateBalance(id, companyId);
  }
}
