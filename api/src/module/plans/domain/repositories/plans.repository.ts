import { Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DrizzleService } from '../../../../shared/database/drizzle/drizzle.service';
import {
  NewPlanDay,
  PLAN_DAYS,
  PlanDay,
} from '../../../../shared/database/drizzle/schema/plan-days';
import {
  NewPlan,
  PLANS,
  Plan,
} from '../../../../shared/database/drizzle/schema/plans';

@Injectable()
export class PlansRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  public async getAll(): Promise<Plan[]> {
    return this.drizzleService.db.select().from(PLANS);
  }

  public async findById(id: string): Promise<Plan | null> {
    const [plan] = await this.drizzleService.db
      .select()
      .from(PLANS)
      .where(eq(PLANS.id, id));

    return plan || null;
  }

  public async findBySlug(slug: string): Promise<Plan | null> {
    const [plan] = await this.drizzleService.db
      .select()
      .from(PLANS)
      .where(eq(PLANS.slug, slug));

    return plan || null;
  }

  public async getDaysByPlanId(planId: string): Promise<PlanDay[]> {
    return this.drizzleService.db
      .select()
      .from(PLAN_DAYS)
      .where(eq(PLAN_DAYS.planId, planId))
      .orderBy(asc(PLAN_DAYS.dayNumber));
  }

  public async findDayById(id: string): Promise<PlanDay | null> {
    const [day] = await this.drizzleService.db
      .select()
      .from(PLAN_DAYS)
      .where(eq(PLAN_DAYS.id, id));

    return day || null;
  }

  public async findDayByNumber(
    planId: string,
    dayNumber: number,
  ): Promise<PlanDay | null> {
    const [day] = await this.drizzleService.db
      .select()
      .from(PLAN_DAYS)
      .where(
        and(eq(PLAN_DAYS.planId, planId), eq(PLAN_DAYS.dayNumber, dayNumber)),
      );

    return day || null;
  }

  public async create(
    values: NewPlan,
    days: Omit<NewPlanDay, 'planId'>[],
  ): Promise<Plan> {
    return this.drizzleService.db.transaction(async (tx) => {
      const [plan] = await tx.insert(PLANS).values(values).returning();

      if (days.length > 0) {
        await tx
          .insert(PLAN_DAYS)
          .values(days.map((day) => ({ ...day, planId: plan.id })));
      }

      return plan;
    });
  }

  public async createDay(values: NewPlanDay): Promise<PlanDay> {
    const [day] = await this.drizzleService.db
      .insert(PLAN_DAYS)
      .values(values)
      .returning();

    return day;
  }
}
