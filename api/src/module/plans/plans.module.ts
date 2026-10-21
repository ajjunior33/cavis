import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PlansService } from './application/services/plans.service';
import { PlansRepository } from './domain/repositories/plans.repository';
import { PlansController } from './presentation/http/controllers/plans.controller';

@Module({
  imports: [UsersModule],
  providers: [PlansService, PlansRepository],
  controllers: [PlansController],
  exports: [PlansService],
})
export class PlansModule {}
