import type { HashtagEntity, Indices, MediaEntity, SymbolEntity, UrlEntity, UserMentionEntity } from './entities'
import type { QuotedTweet, Tweet } from './tweet'
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

export interface LinkPreviewCard {
  type: 'summary' | 'summary_large_image' | 'unified_card' | 'unknown' | 'player'
  /** 跳转链接 */
  url: string
  /** 显示标题 */
  title: string
  /** 显示描述 */
  description: string
  /** 显示域名  */
  domain: string
  /** 图片地址 */
  imageUrl: string
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

export interface EntityBase {
  text: string
  translation?: string
  index: number
}

export type TranslationEntity = EntityBase & (
  | TextEntity
  | (HashtagEntity & { type: 'hashtag', href: string })
)

export type Entity = EntityBase & (
  | TextEntity
  | (HashtagEntity & { type: 'hashtag', href: string })
  | (UserMentionEntity & { type: 'mention', href: string })
  | (UrlEntity & { type: 'url', href: string })
  | (MediaEntity & { type: 'media', href: string })
  | (SymbolEntity & { type: 'symbol', href: string })
)

type OmitTypes = 'entities' | 'quoted_tweet' | 'edit_control' | 'isEdited' | 'isStaleEdit' | 'possibly_sensitive' | 'news_action_type' | 'card'

export type EnrichedTweet = Omit<Tweet, OmitTypes> & {
  url: string
  entities: Entity[]
  quoted_tweet_id?: string
  quotedTweet?: EnrichedTweet
  card?: LinkPreviewCard
  conversation_count: number
}

export type EnrichedQuotedTweet = Omit<QuotedTweet, 'entities'> & {
  url: string
  entities: Entity[]
}
