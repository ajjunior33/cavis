import { Module } from '@nestjs/common';
import { CheckInsModule } from '../check-ins/check-ins.module';
import { DailyContentsModule } from '../daily-contents/daily-contents.module';
import { TodayService } from './application/services/today.service';
import { TodayController } from './presentation/http/controllers/today.controller';

@Module({
  imports: [CheckInsModule, DailyContentsModule],
  providers: [TodayService],
  controllers: [TodayController],
})
export class TodayModule {}
