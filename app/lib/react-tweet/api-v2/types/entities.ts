export type Indices = [number, number]

export interface HashtagEntity {
  indices: Indices
  text: string
}

export interface UserMentionEntity {
  id_str: string
  indices: Indices
  name: string
  screen_name: string
}

export interface MediaEntity {
  display_url: string
  expanded_url: string
  indices: Indices
  url: string
}

export interface UrlEntity {
  display_url: string
  expanded_url: string
  indices: Indices
  url: string
}

export interface SymbolEntity {
  indices: Indices
  text: string
}

export interface TweetEntities {
  hashtags: HashtagEntity[]
  urls: UrlEntity[]
  user_mentions: UserMentionEntity[]
  symbols: SymbolEntity[]
  media?: MediaEntity[]
}

interface TextEntity {
  indices: Indices
  type: 'text'
}

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

/**
 * 存在DB中的翻译结果
 */
export type TranslationEntity = EntityBase & (
  | TextEntity
  | (HashtagEntity & { type: 'hashtag', href: string })
)

/**
 * 推文实体类
 */
export type Entity = EntityBase & (
  | TextEntity
  | (HashtagEntity & { type: 'hashtag', href: string })
  | (UserMentionEntity & { type: 'mention', href: string })
  | (UrlEntity & { type: 'url', href: string })
  | (MediaEntity & { type: 'media', href: string })
  | (SymbolEntity & { type: 'symbol', href: string })
)
