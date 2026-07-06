import { Module } from '@nestjs/common';
import { CashRegistersController } from './cash-registers.controller';
import { VouchersController } from './vouchers.controller';
import { DailyClosuresController } from './daily-closures.controller';
import { CashRegistersService } from './cash-registers.service';
import { VouchersService } from './vouchers.service';
import { DailyClosuresService } from './daily-closures.service';

@Module({
  controllers: [CashRegistersController, VouchersController, DailyClosuresController],
  providers: [CashRegistersService, VouchersService, DailyClosuresService],
  exports: [CashRegistersService, VouchersService, DailyClosuresService],
})
export class TreasuryModule {}
