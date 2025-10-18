import type { HashtagEntity, Indices, MediaEntity, SymbolEntity, UrlEntity, UserMentionEntity } from './entities'
import type { TweetPhoto } from './photo'
import type { QuotedTweet, Tweet } from './tweet'
import type { TweetVideo } from './video'
import type { ITweetDetailsResponse } from '~/lib/rettiwt-api/types/raw/tweet/Details'

export type * from './edit'
export type * from './entities'
export type * from './media'
export type * from './photo'
// export type * from './tweet'
export type * from './user'
export type * from './video'

export type RawTweet = ITweetDetailsResponse['data']['tweetResult']['result']

// Twitter Card Types
export interface TwitterCardImage {
  url: string
  width: number
  height: number
}

export interface TwitterCardBindingValue {
  key: string
  value: {
    type: 'STRING' | 'IMAGE' | 'IMAGE_COLOR' | 'USER'
    string_value?: string
    image_value?: {
      height: number
      width: number
      url: string
    }
    image_color_value?: {
      palette: Array<{
        rgb: {
          blue: number
          green: number
          red: number
        }
        percentage: number
      }>
    }
    user_value?: {
      id_str: string
      path: any[]
    }
    scribe_key?: string
  }
}

export interface TwitterCard {
  rest_id?: string
  legacy?: {
    binding_values?: TwitterCardBindingValue[]
    card_platform?: {
      platform: {
        audience: {
          name: string
        }
        device: {
          name: string
          version: string
        }
      }
    }
    name?: string
    url?: string
    user_refs_results?: any[]
  }
  // Processed fields for easier access
  type?: 'summary' | 'summary_large_image' | 'unified_card' | 'unknown' | 'player'
  url?: string
  title?: string
  description?: string
  domain?: string
  image?: TwitterCardImage
  images?: {
    small?: TwitterCardImage
    medium?: TwitterCardImage
    large?: TwitterCardImage
    original?: TwitterCardImage
  }
}

interface TextEntity {
  indices: Indices
  type: 'text'
}

export type TweetEntity = HashtagEntity | UserMentionEntity | UrlEntity | MediaEntity | SymbolEntity

export type EntityWithType
  = | TextEntity
    | (HashtagEntity & { type: 'hashtag' })
    | (UserMentionEntity & { type: 'mention' })
    | (UrlEntity & { type: 'url' })
    | (MediaEntity & { type: 'media' })
    | (SymbolEntity & { type: 'symbol' })

export type Entity = {
  text: string
} & (
  | TextEntity
  | (HashtagEntity & { type: 'hashtag', href: string })
  | (UserMentionEntity & { type: 'mention', href: string })
  | (UrlEntity & { type: 'url', href: string })
  | (MediaEntity & { type: 'media', href: string })
  | (SymbolEntity & { type: 'symbol', href: string })
)

export type EnrichedTweet = Omit<Tweet, 'entities' | 'quoted_tweet'> & {
  url: string
  user: {
    url: string
    follow_url: string
  }
  like_url: string
  reply_url: string
  in_reply_to_url?: string
  entities: Entity[]
  quoted_tweet?: EnrichedTweet
  card?: TwitterCard
  photos?: TweetPhoto[]
  video?: TweetVideo
  possibly_sensitive?: boolean
  isEdited: boolean
  isStaleEdit: boolean
  conversation_count: number
  news_action_type: string
}

export type EnrichedQuotedTweet = Omit<QuotedTweet, 'entities'> & {
  url: string
  entities: Entity[]
}
