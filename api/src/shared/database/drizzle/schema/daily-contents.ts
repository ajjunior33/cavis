import { boolean, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';

//Conteúdo do dia (reflexão + prática)

const dailyContents = pgTable('daily_contents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  reflection: text('reflection').notNull(),
  practice: text('practice').notNull(),
  durationMin: integer('duration_min'),
  isDemo: boolean('is_demo').notNull().default(true),
});

export const DAILY_CONTENTS = dailyContents;

export type DailyContent = typeof DAILY_CONTENTS.$inferSelect;
export type NewDailyContent = typeof DAILY_CONTENTS.$inferInsert;
