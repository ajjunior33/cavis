import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { MoodsService } from './application/services/moods.service';
import { MoodsRepository } from './domain/repositories/moods.repository';
import { MoodsController } from './presentation/http/controllers/moods.controller';

@Module({
  imports: [UsersModule],
  providers: [MoodsService, MoodsRepository],
  controllers: [MoodsController],
  exports: [MoodsService],
})
export class MoodsModule {}
