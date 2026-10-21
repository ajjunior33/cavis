import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { PLAN_DAYS } from './plan-days';
import { USER_PLANS } from './user-plans';

//Conclusão de cada dia (progresso) — a unique garante idempotência

const planDayCompletions = pgTable(
  'plan_day_completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userPlanId: uuid('user_plan_id')
      .notNull()
      .references(() => USER_PLANS.id, { onDelete: 'cascade' }),
    planDayId: uuid('plan_day_id')
      .notNull()
      .references(() => PLAN_DAYS.id),
    completedAt: timestamp('completed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.userPlanId, table.planDayId)],
);

export const PLAN_DAY_COMPLETIONS = planDayCompletions;

export type PlanDayCompletion = typeof PLAN_DAY_COMPLETIONS.$inferSelect;
export type NewPlanDayCompletion = typeof PLAN_DAY_COMPLETIONS.$inferInsert;
