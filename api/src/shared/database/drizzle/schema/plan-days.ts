import { integer, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { PLANS } from './plans';

//Dias de cada plano

const planDays = pgTable(
  'plan_days',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => PLANS.id, { onDelete: 'cascade' }),
    dayNumber: integer('day_number').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    practice: text('practice'),
  },
  (table) => [unique().on(table.planId, table.dayNumber)],
);

export const PLAN_DAYS = planDays;

export type PlanDay = typeof PLAN_DAYS.$inferSelect;
export type NewPlanDay = typeof PLAN_DAYS.$inferInsert;
