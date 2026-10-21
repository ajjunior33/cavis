import { Module } from '@nestjs/common';
import { CheckInsModule } from '../check-ins/check-ins.module';
import { UserPlansModule } from '../user-plans/user-plans.module';
import { JourneyService } from './application/services/journey.service';
import { JourneyController } from './presentation/http/controllers/journey.controller';

@Module({
  imports: [CheckInsModule, UserPlansModule],
  providers: [JourneyService],
  controllers: [JourneyController],
})
export class JourneyModule {}
