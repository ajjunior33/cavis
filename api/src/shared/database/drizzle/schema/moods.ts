import {
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

//Catálogo de estados emocionais

const moods = pgTable('moods', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug').notNull().unique(),
  label: varchar('label').notNull(),
  emoji: varchar('emoji'),
  soft_order: integer().notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

export const MOODS = moods;

export type Mood = typeof MOODS.$inferInsert;
export type NewMood = typeof MOODS.$inferInsert;
