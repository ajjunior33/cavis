import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ZodValidationPipe } from '../../../../../shared/pipes/zod-validation.pipe';
import { UserPlansService } from '../../../application/services/user-plans.service';
import {
  enrollUserPlanSchema,
  type EnrollUserPlanDTO,
} from './schemas/enroll-user-plan.schema';
import { planDayIdSchema } from './schemas/plan-day-id.schema';
import { userPlanIdSchema } from './schemas/user-plan-id.schema';

@Controller('user-plans')
export class UserPlansController {
  constructor(private readonly userPlansService: UserPlansService) {}

  @Get('/')
  public async list(@Req() request: Request) {
    return this.userPlansService.list(request.user!.id);
  }

  @Get('/:id')
  public async findById(
    @Req() request: Request,
    @Param('id', new ZodValidationPipe(userPlanIdSchema)) id: string,
  ) {
    return this.userPlansService.findById(request.user!.id, id);
  }

  @Post('/')
  public async enroll(
    @Req() request: Request,
    @Body(new ZodValidationPipe(enrollUserPlanSchema))
    body: EnrollUserPlanDTO,
  ) {
    return this.userPlansService.enroll(request.user!.id, body.plan_id);
  }

  @Post('/:id/days/:planDayId/complete')
  public async completeDay(
    @Req() request: Request,
    @Param('id', new ZodValidationPipe(userPlanIdSchema)) id: string,
    @Param('planDayId', new ZodValidationPipe(planDayIdSchema))
    planDayId: string,
  ) {
    return this.userPlansService.completeDay(request.user!.id, id, planDayId);
  }
}
