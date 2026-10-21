import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { PLANS } from './plans';
import { USERS } from './users';

//Inscrição do usuário no plano

const userPlans = pgTable(
  'user_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => USERS.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => PLANS.id),
    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [unique().on(table.userId, table.planId)],
);

export const USER_PLANS = userPlans;

export type UserPlan = typeof USER_PLANS.$inferSelect;
export type NewUserPlan = typeof USER_PLANS.$inferInsert;
