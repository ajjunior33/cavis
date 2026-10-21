import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../../../../shared/guards/admin.guard';
import { ZodValidationPipe } from '../../../../../shared/pipes/zod-validation.pipe';
import { PlansService } from '../../../application/services/plans.service';
import {
  createPlanDaySchema,
  type CreatePlanDayDTO,
} from './schemas/create-plan-day.schema';
import {
  createPlanSchema,
  type CreatePlanDTO,
} from './schemas/create-plan.schema';
import { planIdSchema } from './schemas/plan-id.schema';
import { planSlugSchema } from './schemas/plan-slug.schema';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('/')
  public async list() {
    return this.plansService.list();
  }

  @Get('/:slug')
  public async findBySlug(
    @Param('slug', new ZodValidationPipe(planSlugSchema)) slug: string,
  ) {
    return this.plansService.findBySlug(slug);
  }

  @UseGuards(AdminGuard)
  @Post('/')
  public async create(
    @Body(new ZodValidationPipe(createPlanSchema)) body: CreatePlanDTO,
  ) {
    return this.plansService.create(body);
  }

  @UseGuards(AdminGuard)
  @Post('/:id/days')
  public async createDay(
    @Param('id', new ZodValidationPipe(planIdSchema)) id: string,
    @Body(new ZodValidationPipe(createPlanDaySchema)) body: CreatePlanDayDTO,
  ) {
    return this.plansService.createDay(id, body);
  }
}
