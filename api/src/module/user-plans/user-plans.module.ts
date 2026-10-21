import { Module } from '@nestjs/common';
import { PlansModule } from '../plans/plans.module';
import { UserPlansService } from './application/services/user-plans.service';
import { UserPlansRepository } from './domain/repositories/user-plans.repository';
import { UserPlansController } from './presentation/http/controllers/user-plans.controller';

@Module({
  imports: [PlansModule],
  providers: [UserPlansService, UserPlansRepository],
  controllers: [UserPlansController],
  exports: [UserPlansService],
})
export class UserPlansModule {}
