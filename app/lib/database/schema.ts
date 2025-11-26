import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// Better auth tables
// Added indexes based on the table provided by Better auth
// https://www.better-auth.com/docs/concepts/database
export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey().notNull(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('emailVerified').notNull().default(false),
    image: text('image'),
    role: text('role', { enum: ['user', 'admin'] })
      .notNull()
      .default('user'),
    banned: boolean('banned').notNull().default(false),
    banReason: text('banReason'),
    banExpires: timestamp('banExpires'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  table => [index('user_email_idx').on(table.email)],
)

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expiresAt').notNull().defaultNow(),
    token: text('token').notNull().unique(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId')
      .notNull()
      .references(() => user.id),
    impersonatedBy: text('impersonatedBy'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  table => [
    index('session_userId_idx').on(table.userId),
    index('session_token_idx').on(table.token),
  ],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => user.id),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  table => [
    index('account_userId_idx').on(table.userId),
    index('account_providerId_accountId_idx').on(
      table.providerId,
      table.accountId,
    ),
  ],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expiresAt').notNull().defaultNow(),
    createdAt: timestamp('createdAt').defaultNow(),
    updatedAt: timestamp('updatedAt').defaultNow(),
  },
  table => [index('verification_identifier_idx').on(table.identifier)],
)

export const rateLimit = pgTable(
  'rateLimit',
  {
    id: text().primaryKey(),
    key: text('key'),
    count: integer('count'),
    lastRequest: integer('lastRequest'),
  },
  table => [index('rateLimit_key_idx').on(table.key)],
)

// Todo tables
export const todo = pgTable(
  'todo',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    completed: integer('completed').notNull().default(0),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  table => [index('todo_userId_idx').on(table.userId)],
)

// Type
export type SelectTodo = typeof todo.$inferSelect
export type InsertTodo = typeof todo.$inferInsert
