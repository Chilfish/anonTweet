import type { EnrichedTweet as BaseEnrichedTweet, RawTweet } from '@chilfish/tweet'
import type { UserData } from '@chilfish/tweet/internals'
import type { Entity } from './entities'
import type { AIVisionInfo } from './vision'

export type * from './article'
export type * from './card'
export type * from './entities'
// Instagram 类型
export type { IGAudio, IGMedia, IGPost, IGPostData, IGProfile, IGProfileData, IGStoryLink } from './ins'
export type * from './media'
export type * from './photo'
export type * from './poll'
export type * from './space'
export type * from './user'
export type * from './video'

export type { RawTweet }

/** `fetchUserDetails` / `twitter.getUser()` 返回的 model 数据形状。 */
export type RawUser = UserData

/**
 * 富化推文：以 `@chilfish/tweet` 的 `EnrichedTweet` 为基础，
 * 只追加本应用的 AI 扩展字段；`quotedTweet` / `comments` 递归使用本地类型。
 */
export type EnrichedTweet = Omit<BaseEnrichedTweet, 'quotedTweet' | 'comments'> & {
  autoTranslationEntities?: Entity[]
  visionInfo?: AIVisionInfo[]
  quotedTweet?: EnrichedTweet
  comments?: EnrichedTweet[]
}

export type TweetData = EnrichedTweet[]

export type * from './vision'
