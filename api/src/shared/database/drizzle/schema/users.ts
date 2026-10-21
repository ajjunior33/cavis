import { pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const roleEnumUsers = pgEnum('role_enum_user', ['USER', 'SUPER_ADMIN']);

const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: roleEnumUsers('role').default('USER').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

export const USERS = users;

export type User = typeof USERS.$inferSelect;
export type NewUser = typeof USERS.$inferInsert;
export type SafeUser = Omit<User, 'password_hash'>;
