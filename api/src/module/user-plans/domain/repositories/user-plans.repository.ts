import { Injectable } from '@nestjs/common';
import { and, count, eq, isNull } from 'drizzle-orm';
import { DrizzleService } from '../../../../shared/database/drizzle/drizzle.service';
import { PLAN_DAY_COMPLETIONS } from '../../../../shared/database/drizzle/schema/plan-day-completions';
import { PLANS } from '../../../../shared/database/drizzle/schema/plans';
import {
  NewUserPlan,
  USER_PLANS,
  UserPlan,
} from '../../../../shared/database/drizzle/schema/user-plans';

@Injectable()
export class UserPlansRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  public async getAllByUserId(userId: string) {
    const rows = await this.drizzleService.db
      .select({
        userPlan: USER_PLANS,
        plan: PLANS,
        completedDays: count(PLAN_DAY_COMPLETIONS.id),
      })
      .from(USER_PLANS)
      .innerJoin(PLANS, eq(PLANS.id, USER_PLANS.planId))
      .leftJoin(
        PLAN_DAY_COMPLETIONS,
        eq(PLAN_DAY_COMPLETIONS.userPlanId, USER_PLANS.id),
      )
      .where(eq(USER_PLANS.userId, userId))
      .groupBy(USER_PLANS.id, PLANS.id);

    return rows.map((row) => ({
      ...row.userPlan,
      plan: row.plan,
      completedDays: row.completedDays,
    }));
  }

  public async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<UserPlan | null> {
    const [userPlan] = await this.drizzleService.db
      .select()
      .from(USER_PLANS)
      .where(and(eq(USER_PLANS.id, id), eq(USER_PLANS.userId, userId)));

    return userPlan || null;
  }

  public async findByUserIdAndPlanId(
    userId: string,
    planId: string,
  ): Promise<UserPlan | null> {
    const [userPlan] = await this.drizzleService.db
      .select()
      .from(USER_PLANS)
      .where(and(eq(USER_PLANS.userId, userId), eq(USER_PLANS.planId, planId)));

    return userPlan || null;
  }

  public async getCompletions(userPlanId: string) {
    return this.drizzleService.db
      .select({
        planDayId: PLAN_DAY_COMPLETIONS.planDayId,
        completedAt: PLAN_DAY_COMPLETIONS.completedAt,
      })
      .from(PLAN_DAY_COMPLETIONS)
      .where(eq(PLAN_DAY_COMPLETIONS.userPlanId, userPlanId));
  }

  public async create(values: NewUserPlan): Promise<UserPlan> {
    const [userPlan] = await this.drizzleService.db
      .insert(USER_PLANS)
      .values(values)
      .returning();

    return userPlan;
  }

  /**
   * Registra a conclusão do dia (idempotente) e, se todos os dias do plano
   * estiverem concluídos, marca a inscrição como concluída.
   */
  public async completeDay(
    userPlanId: string,
    planDayId: string,
    totalDays: number,
  ): Promise<{ completedDays: number; completedAt: Date | null }> {
    return this.drizzleService.db.transaction(async (tx) => {
      await tx
        .insert(PLAN_DAY_COMPLETIONS)
        .values({ userPlanId, planDayId })
        .onConflictDoNothing({
          target: [
            PLAN_DAY_COMPLETIONS.userPlanId,
            PLAN_DAY_COMPLETIONS.planDayId,
          ],
        });

      const [{ completedDays }] = await tx
        .select({ completedDays: count() })
        .from(PLAN_DAY_COMPLETIONS)
        .where(eq(PLAN_DAY_COMPLETIONS.userPlanId, userPlanId));

      if (completedDays >= totalDays) {
        await tx
          .update(USER_PLANS)
          .set({ completedAt: new Date() })
          .where(
            and(eq(USER_PLANS.id, userPlanId), isNull(USER_PLANS.completedAt)),
          );
      }

      const [{ completedAt }] = await tx
        .select({ completedAt: USER_PLANS.completedAt })
        .from(USER_PLANS)
        .where(eq(USER_PLANS.id, userPlanId));

      return { completedDays, completedAt };
    });
  }
}
