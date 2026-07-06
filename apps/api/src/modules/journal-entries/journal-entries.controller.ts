import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JournalEntriesService } from './journal-entries.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { JournalEntryFilterDto } from './dto/journal-entry-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('قيود اليومية - Journal Entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('journal-entries')
export class JournalEntriesController {
  constructor(private journalEntriesService: JournalEntriesService) {}

  @Post()
  @ApiOperation({ summary: 'إنشاء قيد يومية جديد' })
  create(
    @Body() dto: CreateJournalEntryDto,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.journalEntriesService.create(dto, companyId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'عرض كل قيود اليومية' })
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() filter?: JournalEntryFilterDto,
  ) {
    return this.journalEntriesService.findAll(companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'عرض قيد يومية معين' })
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.journalEntriesService.findOne(id, companyId);
  }

  @Put(':id/post')
  @ApiOperation({ summary: 'ترحيل قيد اليومية' })
  post(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.journalEntriesService.post(id, companyId, userId);
  }

  @Put(':id/reverse')
  @ApiOperation({ summary: 'عكس قيد اليومية' })
  reverse(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.journalEntriesService.reverse(id, companyId, userId);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'إلغاء قيد اليومية' })
  cancel(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.journalEntriesService.cancel(id, companyId);
  }
}
