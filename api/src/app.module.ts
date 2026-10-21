import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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

@Module({
  imports: [
    DrizzleModule,
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
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
