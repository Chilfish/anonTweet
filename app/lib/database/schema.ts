import type { EnrichedTweet, IGPost, RawUser, TranslationEntity } from '~/types'
import {
  index,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const tweet = pgTable(
  'tweet',
  {
    id: serial('id').primaryKey(),
    jsonContent: json('jsonContent').$type<EnrichedTweet>().notNull(),
    tweetOwnerId: text('tweetOwnerId').notNull(),
    tweetId: text('tweetId').notNull().unique(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  table => [index('tweet_ownerId_idx').on(table.tweetOwnerId)],
)

export const tweetEntities = pgTable(
  'tweet_entities',
  {
    id: serial('id').primaryKey(),
    tweetId: text('tweetId').notNull().unique(),
    entities: json('entities').$type<TranslationEntity[]>().notNull(),
  },
  table => [
    index('tweet_entities_tweetId_idx').on(table.tweetId),
  ],
)

export const tweetUser = pgTable(
  'tweet_user',
  {
    id: serial('id').primaryKey(),
    tweetUserName: text('tweetUserName').notNull().unique(),
    user: json('user').$type<RawUser>().notNull(),
  },
)

/**
 * Instagram 帖子缓存表。
 *
 * 以 postShortcode 为唯一键，存储完整的 IGPost JSON。
 * username 索引用于按作者查询。
 */
export const igPost = pgTable(
  'ig_post',
  {
    id: serial('id').primaryKey(),
    postShortcode: text('postShortcode').notNull().unique(),
    username: text('username').notNull(),
    jsonContent: json('jsonContent').$type<IGPost>().notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  table => [index('ig_post_username_idx').on(table.username)],
)

export type SelectTweet = typeof tweet.$inferSelect
export type InsertTweet = typeof tweet.$inferInsert

export type SelectEntities = typeof tweetEntities.$inferSelect
export type InsertEntities = typeof tweetEntities.$inferInsert

export type SelectIGPost = typeof igPost.$inferSelect
export type InsertIGPost = typeof igPost.$inferInsert
