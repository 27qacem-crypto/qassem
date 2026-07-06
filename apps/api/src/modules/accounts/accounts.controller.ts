import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('شجرة الحسابات - Chart of Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء حساب جديد' })
  create(@Body() dto: CreateAccountDto, @CurrentUser('companyId') companyId: string) {
    return this.accountsService.create(dto, companyId);
  }

  @Get()
  @ApiOperation({ summary: 'عرض كل الحسابات' })
  @ApiQuery({ name: 'type', enum: AccountType, required: false })
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query('type') type?: AccountType,
  ) {
    return this.accountsService.findAll(companyId, type);
  }

  @Get('tree')
  @ApiOperation({ summary: 'عرض شجرة الحسابات' })
  getTree(@CurrentUser('companyId') companyId: string) {
    return this.accountsService.getTree(companyId);
  }

  @Get('balances')
  @ApiOperation({ summary: 'عرض أرصدة الحسابات' })
  getBalances(
    @CurrentUser('companyId') companyId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.accountsService.getBalances(
      companyId,
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'عرض حساب معين' })
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.accountsService.findOne(id, companyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث حساب' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.accountsService.update(id, dto, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف حساب (تعطيل)' })
  remove(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.accountsService.remove(id, companyId);
  }
}
