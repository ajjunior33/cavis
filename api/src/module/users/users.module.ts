import { Module } from '@nestjs/common';
import { UsersService } from './application/services/users.service';
import { UsersRepository } from './domains/repositories/users.repository';
import { UsersController } from './presentation/http/controllers/users.controller';

@Module({
  providers: [UsersService, UsersRepository],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
