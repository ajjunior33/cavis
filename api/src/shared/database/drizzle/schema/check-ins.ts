import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { MOODS } from './moods';
import { USERS } from './users';

//Registro de humor do usuário

const checkIns = pgTable(
  'check_ins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => USERS.id, { onDelete: 'cascade' }),
    moodId: uuid('mood_id')
      .notNull()
      .references(() => MOODS.id),
    // opcional (dado sensível em produção)
    note: text('note'),
    checkedAt: timestamp('checked_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    // dia do usuário (fuso America/Sao_Paulo)
    localDate: date('local_date', { mode: 'string' }).notNull(),
  },
  (table) => [
    index('idx_check_ins_user_date').on(table.userId, table.checkedAt.desc()),
  ],
);

export const CHECK_INS = checkIns;

export type CheckIn = typeof CHECK_INS.$inferSelect;
export type NewCheckIn = typeof CHECK_INS.$inferInsert;
