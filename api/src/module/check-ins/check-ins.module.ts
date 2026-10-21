import { Module } from '@nestjs/common';
import { MoodsModule } from '../moods/moods.module';
import { CheckInsService } from './application/services/check-ins.service';
import { CheckInsRepository } from './domain/repositories/check-ins.repository';
import { CheckInsController } from './presentation/http/controllers/check-ins.controller';

@Module({
  imports: [MoodsModule],
  providers: [CheckInsService, CheckInsRepository],
  controllers: [CheckInsController],
  exports: [CheckInsService],
})
export class CheckInsModule {}
