import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { DailyContentsService } from './application/services/daily-contents.service';
import { DailyContentsRepository } from './domain/repositories/daily-contents.repository';
import { DailyContentsController } from './presentation/http/controllers/daily-contents.controller';

@Module({
  imports: [UsersModule],
  providers: [DailyContentsService, DailyContentsRepository],
  controllers: [DailyContentsController],
  exports: [DailyContentsService],
})
export class DailyContentsModule {}
