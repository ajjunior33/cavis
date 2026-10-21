import { boolean, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

//Planos temáticos

const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  totalDays: integer('total_days').notNull(),
  isDemo: boolean('is_demo').notNull().default(true),
});

export const PLANS = plans;

export type Plan = typeof PLANS.$inferSelect;
export type NewPlan = typeof PLANS.$inferInsert;
