import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthTokenService } from './application/services/auth-token.service';
import { AuthService } from './application/services/auth.service';
import { AuthController } from './presentation/http/controllers/auth.controller';

@Module({
  imports: [UsersModule, JwtModule.register({})],
  providers: [AuthService, AuthTokenService],
  exports: [AuthService, AuthTokenService],
  controllers: [AuthController],
})
export class AuthModule {}
