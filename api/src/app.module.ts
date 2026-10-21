import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env';
import { AuthModule } from './module/auth/auth.module';
import { AuthGuard } from './module/auth/presentation/http/guards/auth.guard';
import { CheckInsModule } from './module/check-ins/check-ins.module';
import { DailyContentsModule } from './module/daily-contents/daily-contents.module';
import { HealthModule } from './module/health/health.module';
import { JourneyModule } from './module/journey/journey.module';
import { MoodsModule } from './module/moods/moods.module';
import { PlansModule } from './module/plans/plans.module';
import { TodayModule } from './module/today/today.module';
import { UserPlansModule } from './module/user-plans/user-plans.module';
import { UsersModule } from './module/users/users.module';
import { DrizzleModule } from './shared/database/drizzle/drizzle.module';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';

@Module({
  imports: [
    DrizzleModule,
    // Sem guard global: o limite só vale onde UserThrottlerGuard é aplicado.
    // Storage em memória (por instância); com várias instâncias, usar Redis.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 5 }],
      errorMessage: 'Muitas tentativas. Tente novamente em instantes.',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: '.env',
    }),
    HealthModule,
    UsersModule,
    MoodsModule,
    CheckInsModule,
    DailyContentsModule,
    PlansModule,
    UserPlansModule,
    TodayModule,
    JourneyModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
