import { Module } from '@nestjs/common';
import { HealthService } from './application/services/health.service';
import { HealthController } from './presentation/http/controllers/health.controller';

@Module({
  providers: [HealthService],
  controllers: [HealthController],
})
export class HealthModule {}
