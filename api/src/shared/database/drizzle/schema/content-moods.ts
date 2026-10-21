import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { DAILY_CONTENTS } from './daily-contents';
import { MOODS } from './moods';

//Qual conteúdo recomendar para cada estado (N:N)

const contentMoods = pgTable(
  'content_moods',
  {
    contentId: uuid('content_id')
      .notNull()
      .references(() => DAILY_CONTENTS.id, { onDelete: 'cascade' }),
    moodId: uuid('mood_id')
      .notNull()
      .references(() => MOODS.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.contentId, table.moodId] })],
);

export const CONTENT_MOODS = contentMoods;

export type ContentMood = typeof CONTENT_MOODS.$inferSelect;
export type NewContentMood = typeof CONTENT_MOODS.$inferInsert;
