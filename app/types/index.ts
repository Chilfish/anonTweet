import type { LinkPreviewCard } from './card'
import type { Entity } from './entities'
import type { QuotedTweet, Tweet } from './tweet'
import type { IUser } from '~/lib/rettiwt-api'
import type { ITweetDetailsResponse } from '~/lib/rettiwt-api/types/raw/tweet/Details'

export type * from './card'
export type * from './entities'
export type * from './media'
export type * from './photo'
export type * from './user'
export type * from './video'

export type RawTweet = ITweetDetailsResponse['data']['tweetResult']['result']

export type RawUser = IUser

type OmitTypes = 'entities' | 'quoted_tweet' | 'edit_control' | 'isEdited' | 'isStaleEdit' | 'possibly_sensitive' | 'news_action_type' | 'card'

export type EnrichedTweet = Omit<Tweet, OmitTypes> & {
  url: string
  entities: Entity[]
  autoTranslationEntities?: Entity[]
  quoted_tweet_id?: string
  quotedTweet?: EnrichedTweet
  card?: LinkPreviewCard
  conversation_count: number
  retweetedOrignalId?: string
}

export type EnrichedQuotedTweet = Omit<QuotedTweet, 'entities'> & {
  url: string
  entities: Entity[]
}

export type TweetData = EnrichedTweet[]
