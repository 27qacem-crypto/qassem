import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('المستخدمين - Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء مستخدم جديد' })
  create(@Body() body: any, @CurrentUser('companyId') companyId: string) {
    return this.usersService.create({ ...body, companyId });
  }

  @Get()
  @ApiOperation({ summary: 'عرض كل المستخدمين' })
  findAll(@CurrentUser('companyId') companyId: string) {
    return this.usersService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'عرض مستخدم معين' })
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.usersService.findOne(id, companyId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث مستخدم' })
  update(@Param('id') id: string, @Body() body: any, @CurrentUser('companyId') companyId: string) {
    return this.usersService.update(id, body, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف مستخدم (تعطيل)' })
  remove(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.usersService.remove(id, companyId);
  }
}
