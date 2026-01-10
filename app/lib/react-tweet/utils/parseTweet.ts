import type {
  EnrichedTweet,
  LinkPreviewCard,
  MediaDetails,
  RawTweet,
  TweetUser,
} from '~/types'
import { getEntities } from './entitytParser'

/**
 * Enriches a tweet with additional data used to more easily use the tweet in a UI.
 */
export function enrichTweet(sourceData: RawTweet, retweetedOrignalId?: string): EnrichedTweet {
  if (sourceData.legacy?.retweeted_status_result) {
    return enrichTweet(sourceData.legacy.retweeted_status_result.result, sourceData.legacy.id_str)
  }

  const tweet = ('tweet' in sourceData ? sourceData.tweet : sourceData) as RawTweet
  const userBase = transformUserResponse(tweet)
  const userScreenName = userBase.screen_name
  const user = userBase

  const tweetId = tweet.rest_id
  const tweetUrl = `https://twitter.com/${userScreenName}/status/${tweetId}`

  const text = tweet.note_tweet?.note_tweet_results?.result?.text || tweet.legacy.full_text

  return {
    id_str: tweet.rest_id,
    lang: tweet.legacy.lang,
    url: tweetUrl,
    created_at: tweet.legacy.created_at,
    __typename: 'Tweet',
    text,
    user,
    in_reply_to_status_id_str: tweet.legacy.in_reply_to_status_id_str,
    entities: getEntities(tweet, text),
    quoted_tweet_id: tweet.quoted_status_result?.result?.rest_id,
    card: mapTwitterCard(tweet.card),
    mediaDetails: mapMediaDetails(tweet),
    retweetedOrignalId,
    // photos: mapPhotoEntities(tweet),
    // video: mapVideoEntities(tweet),
    // parent: parentTweet(tweet),
  }
}

export function transformUserResponse(sourceData: RawTweet): TweetUser {
  const RawTweet = sourceData?.core?.user_results?.result
  const legacy = RawTweet.legacy

  const transformedUser = {
    id_str: RawTweet.rest_id,
    name: RawTweet.core.name,
    screen_name: RawTweet.core.screen_name,
    is_blue_verified: RawTweet.is_blue_verified,
    profile_image_shape: RawTweet.profile_image_shape as TweetUser['profile_image_shape'],
    verified: legacy.verified,
    // @ts-expect-error: The verified_type is not always defined
    verified_type: legacy.verified_type,
    profile_image_url_https: RawTweet.avatar.image_url,
  }

  return transformedUser
}

// 统一的图片 Key 优先级列表，按清晰度从高到低排列
const IMAGE_KEYS_PRIORITY = [
  // Unified / Large
  'photo_image_full_size_original',
  'photo_image_full_size_large',
  'photo_image_full_size',
  // Summary
  'thumbnail_image_original',
  'thumbnail_image_large',
  'thumbnail_image',
  // Player
  'player_image_original',
  'player_image_large',
  'player_image',
  // Fallback
  'summary_photo_image_original',
  'summary_photo_image_large',
  'summary_photo_image',
]

/**
 * 辅助函数：从 binding_values Map 中提取字符串值
 */
const getStr = (map: Map<string, any>, key: string) => map.get(key)?.string_value

/**
 * 辅助函数：从 binding_values Map 中按优先级提取最佳图片 URL
 */
function getBestImage(map: Map<string, any>) {
  for (const key of IMAGE_KEYS_PRIORITY) {
    const img = map.get(key)?.image_value
    if (img?.url)
      return img.url
  }
  return undefined
}

/**
 * 辅助函数：解析 Unified Card (YouTube 等) 的复杂 JSON
 */
function parseUnifiedCard(jsonStr: string | undefined) {
  if (!jsonStr)
    return null
  try {
    const data = JSON.parse(jsonStr)
    const details = data.component_objects?.details_1?.data
    const media = Object.values(data.media_entities || {})[0] as any

    return {
      title: details?.title?.content,
      domain: details?.subtitle?.content,
      url: data.destination_objects?.browser_1?.data?.url_data?.url,
      imageUrl: media?.media_url_https,
    }
  }
  catch {
    return null
  }
}

export function mapTwitterCard(cardData: any): LinkPreviewCard | undefined {
  if (!cardData)
    return undefined

  // 1. 数据归一化：无论是新旧结构，都提取出核心的 name 和 binding_values
  const legacy = cardData.legacy || cardData
  const name = legacy.name
  const bindingValues = legacy.binding_values

  if (!name || !Array.isArray(bindingValues))
    return undefined

  // 2. 将 binding_values 转为 Map 以便快速查找 (O(1))
  const bindings = new Map(bindingValues.map((v: any) => [v.key, v.value]))

  // 3. 基础字段提取
  let card: LinkPreviewCard = {
    type: name === 'player' ? 'summary_large_image' : name, // Player 统一视为大图卡片
    url: legacy.url || getStr(bindings, 'card_url') || '',
    title: getStr(bindings, 'title'),
    description: getStr(bindings, 'description'),
    domain: getStr(bindings, 'domain') || getStr(bindings, 'vanity_url'),
    imageUrl: getBestImage(bindings),
  }

  // 4. 特殊处理 Unified Card (覆盖之前的提取)
  if (name === 'unified_card') {
    const unifiedData = parseUnifiedCard(getStr(bindings, 'unified_card'))
    if (unifiedData) {
      card = { ...card, ...unifiedData }
    }
  }

  // 5. 最终校验与清洗
  // 必须至少有 标题 或 描述 或 图片
  if (!card.title && !card.description && !card.imageUrl) {
    return undefined
  }

  // 域名兜底逻辑
  if (!card.domain && card.url) {
    try {
      card.domain = new URL(card.url).hostname
    }
    catch {}
  }

  return card
}

export function mapMediaDetails(tweet: RawTweet): MediaDetails[] | undefined {
  const mediaEntities = tweet.legacy.entities?.media
  if (!mediaEntities || mediaEntities.length === 0)
    return undefined

  return mediaEntities.map((media) => {
    // 提取公共基础字段
    const baseMedia = {
      media_url_https: media.media_url_https,
      original_info: {
        height: media.original_info.height,
        width: media.original_info.width,
      },
    }

    if (media.type === 'photo') {
      return {
        ...baseMedia,
        type: 'photo' as const,
        ext_alt_text: media.ext_alt_text,
      }
    }

    if (media.type === 'animated_gif' && media.video_info) {
      return {
        ...baseMedia,
        type: 'animated_gif' as const,
        video_info: {
          aspect_ratio: [
            media.video_info.aspect_ratio[0] || 1,
            media.video_info.aspect_ratio[1] || 1,
          ] as [number, number],
          variants: media.video_info.variants,
        },
      }
    }

    if (media.type === 'video' && media.video_info) {
      return {
        ...baseMedia,
        type: 'video' as const,
        video_info: {
          aspect_ratio: [
            media.video_info.aspect_ratio[0] || 1,
            media.video_info.aspect_ratio[1] || 1,
          ] as [number, number],
          variants: [media.video_info.variants.at(-1)!],
        },
      }
    }

    // Fallback: 默认返回 photo 类型以保证类型安全
    return {
      ...baseMedia,
      type: 'photo' as const,
    }
  })
}
