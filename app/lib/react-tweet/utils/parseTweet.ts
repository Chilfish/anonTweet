import type {
  CardCarouselImage,
  EnrichedTweet,
  LinkPreviewCard,
  MediaDetails,
  RawTweet,
  TweetUser,
} from '~/types'
import { obsLog } from '~/lib/obs-log'
import { parseTrendingCard } from '~/lib/rettiwt-api/parsers/jetfuel'
import { mapArticle } from './article'
import { getEntities } from './entitytParser'

/**
 * Enriches a tweet with additional data used to more easily use the tweet in a UI.
 */
export function enrichTweet(sourceData: RawTweet, retweetedOrignalId?: string): EnrichedTweet | null {
  if (!sourceData || sourceData?.__typename === 'TweetTombstone')
    return null

  if (sourceData.legacy?.retweeted_status_result) {
    return enrichTweet(sourceData.legacy.retweeted_status_result.result, sourceData.legacy.id_str)
  }

  const tweet = ('tweet' in sourceData
    ? sourceData.tweet
    : sourceData) as RawTweet
  const userBase = transformUserResponse(tweet)
  if (!userBase)
    return null
  const userScreenName = userBase.screen_name
  const user = userBase

  const tweetId = tweet.rest_id
  const tweetUrl = `https://twitter.com/${userScreenName}/status/${tweetId}`

  const text = tweet.note_tweet?.note_tweet_results?.result?.text || tweet.legacy.full_text
  const entities = getEntities(tweet, text)

  return {
    id_str: tweet.rest_id,
    lang: tweet.legacy.lang,
    url: tweetUrl,
    created_at: tweet.legacy.created_at,
    __typename: 'Tweet',
    text,
    user,
    in_reply_to_status_id_str: tweet.legacy.in_reply_to_status_id_str,
    entities,
    quoted_tweet_id: tweet.quoted_status_result?.result?.rest_id,
    card: mapTwitterCard(tweet.card, (tweet as any).jetfuel_attachment),
    article: mapArticle(tweet, entities) ?? undefined,
    mediaDetails: mapMediaDetails(tweet),
    retweetedOrignalId,
    isInlineMeida: !!tweet.note_tweet?.note_tweet_results?.result?.media?.inline_media?.length,
    // photos: mapPhotoEntities(tweet),
    // video: mapVideoEntities(tweet),
    // parent: parentTweet(tweet),
  }
}

export function transformUserResponse(sourceData: RawTweet): TweetUser | null {
  const rawUser = sourceData?.core?.user_results?.result as any
  const legacy = rawUser?.legacy
  const core = rawUser?.core

  if (!rawUser || !legacy || !core)
    return null

  const transformedUser = {
    id_str: rawUser.rest_id,
    name: core.name,
    screen_name: core.screen_name,
    is_blue_verified: rawUser.is_blue_verified,
    profile_image_shape: rawUser.profile_image_shape as TweetUser['profile_image_shape'],
    verified: legacy.verified,
    verified_type: legacy.verified_type || rawUser.verification?.verified_type,
    profile_image_url_https: rawUser.avatar?.image_url?.replace('_normal', ''),
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

/** 零宽字符（官方空标题常用 \u200b 占位），清洗后为空视为无标题 */
const INVISIBLE_CHARS_RE = /[\u200B-\u200D\uFEFF]/g
/** media id 的 `3_` / `13_` 前缀（部分变体的 media_entities 键不带前缀） */
const MEDIA_ID_PREFIX_RE = /^\d+_/

function cleanCardText(value?: string): string | undefined {
  if (typeof value !== 'string')
    return undefined
  const cleaned = value.replace(INVISIBLE_CHARS_RE, '').trim()
  return cleaned || undefined
}

/** CTA 枚举 → 中文文案（未知值原样保留） */
const CTA_LABELS: Record<string, string> = {
  learn_more: '了解更多',
  visit: '访问',
  shop_now: '立即购买',
  book_now: '立即预订',
  sign_up: '注册',
  download: '下载',
  install: '安装',
  watch: '观看',
  listen: '收听',
  get_offer: '获取优惠',
  order_now: '立即下单',
  shop: '去购物',
  play: '开始游戏',
}

function mapCtaLabel(raw?: string): string | undefined {
  if (!raw)
    return undefined
  return CTA_LABELS[raw] ?? raw
}

function rgbToHex(rgb?: {
  r?: number
  g?: number
  b?: number
  red?: number
  green?: number
  blue?: number
}): string | undefined {
  // 官方 mediaColor 用 red/green/blue，部分缓存用 r/g/b
  const r = rgb?.r ?? rgb?.red
  const g = rgb?.g ?? rgb?.green
  const b = rgb?.b ?? rgb?.blue
  if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number')
    return undefined
  return `#${[r, g, b]
    .map(c => Math.round(c).toString(16).padStart(2, '0'))
    .join('')}`
}

/** 单个 media_list 项 / media 组件项 → 轮播图（缺失实体时返回 null） */
function toCardImage(
  item: any,
  entities: Record<string, any>,
  destinations: Record<string, any>,
): CardCarouselImage | null {
  const id = typeof item === 'string'
    ? item
    : item?.id
  const entity = (id && (entities[id] ?? entities[`3_${id}`] ?? entities[id.replace(MEDIA_ID_PREFIX_RE, '')]))
    ?? (typeof item === 'object'
      ? item
      : undefined)
  if (!entity?.media_url_https)
    return null

  const origin = entity.original_info ?? entity.sizes?.large
  const destinationId = typeof item === 'object'
    ? item.destination
    : undefined
  const href = destinationId
    ? destinations[destinationId]?.data?.url_data?.url
    : undefined
  const palette = entity.ext?.mediaColor?.r?.ok?.palette
  const color = palette?.[0]?.rgb
    ? rgbToHex(palette[0].rgb)
    : undefined

  // 视频：media_url_https 是封面；播放源保留给下游（下载/未来播放器），UI 暂不渲染
  const isVideo = entity.type === 'video' || entity.type === 'animated_gif'
  const variants = Array.isArray(entity.video_info?.variants)
    ? entity.video_info.variants
    : []
  const mp4 = variants
    .filter((v: any) => v?.content_type === 'video/mp4' && v?.url)
    .sort((a: any, b: any) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0]
    ?.url
  const hls = variants.find(
    (v: any) => v?.content_type === 'application/x-mpegURL' && v?.url,
  )?.url
  const durationMs = entity.video_info?.duration_millis ?? entity.video_info?.duration_ms

  return {
    url: entity.media_url_https,
    width: origin?.width ?? origin?.w ?? 0,
    height: origin?.height ?? origin?.h ?? 0,
    ...(href
      ? { href }
      : {}),
    ...(color
      ? { color }
      : {}),
    ...(isVideo
      ? {
          type: 'video' as const,
          ...((mp4 || hls || typeof durationMs === 'number')
            ? {
                video: {
                  ...(mp4
                    ? { mp4 }
                    : {}),
                  ...(hls
                    ? { hls }
                    : {}),
                  ...(typeof durationMs === 'number'
                    ? { durationMs }
                    : {}),
                },
              }
            : {}),
        }
      : {}),
  }
}

/**
 * 按 `components` 声明顺序（缺失时按对象键顺序）遍历媒体组件：
 * - 多图：`swipeable_media.data.media_list`（顺序必须按 media_list，不能依赖对象键顺序）
 * - 单图：`media_1.data.{id,destination}` / `media_id` / 内联 `media`（`image_website`）
 */
function mapCardMedia(data: any): CardCarouselImage[] {
  const components = data.component_objects || {}
  const entities = data.media_entities || {}
  const destinations = data.destination_objects || {}
  const declaredOrder: string[] = Array.isArray(data.components)
    ? data.components
    : []
  const names: string[] = [
    ...declaredOrder.filter(name => components[name]),
    ...Object.keys(components).filter(name => !declaredOrder.includes(name)),
  ]

  const images: CardCarouselImage[] = []
  for (const name of names) {
    const compData = components[name]?.data
    if (!compData)
      continue

    if (Array.isArray(compData.media_list)) {
      for (const item of compData.media_list) {
        const image = toCardImage(item, entities, destinations)
        if (image)
          images.push(image)
      }
      continue
    }

    // 单媒体组件：media_1 / media_with_details_horizontal 的 media_id
    const singleItem = compData.media
      ?? (compData.id || compData.media_id
        ? { ...compData, id: compData.id ?? compData.media_id }
        : undefined)
    if (!singleItem)
      continue

    const image = toCardImage(singleItem, entities, destinations)
    if (image)
      images.push(image)
  }
  return images
}

/**
 * 辅助函数：解析 Unified Card (YouTube / Trending / 单图 / 多图轮播等) 的复杂 JSON
 *
 * 兼容的组件布局：
 * - `details` 布局（YouTube 等）：`component_objects.details_1.data.{title,subtitle}`
 * - `media_with_details_horizontal` 布局（X 站内 Trending/topic 卡）：
 *   `component_objects.media_with_details_horizontal_1.data.topic_detail.{title,subtitle}`
 * - `image_carousel_website` 布局（广告多图卡）：`swipeable_media.data.media_list`
 * - `image_website` 布局（广告单图卡）：`media_1.data.{id,destination}`
 *
 * 标题/描述遍历所有组件提取；域名优先取 destination 的 `url_data.vanity`
 * （真实 X 卡片均带），老 `details` 布局无 vanity 时回退 subtitle。
 */
function parseUnifiedCard(jsonStr: string | undefined) {
  if (!jsonStr)
    return null
  try {
    const data = JSON.parse(jsonStr)

    let title: string | undefined
    let description: string | undefined
    let subtitle: string | undefined // details 布局的 subtitle 在老行为中充当 domain

    // 遍历所有组件，兼容 details / media_with_details_horizontal 等多种布局
    for (const component of Object.values(data.component_objects || {})) {
      const compData = (component as any)?.data
      if (!compData)
        continue
      const topic = compData.topic_detail
      title ??= cleanCardText(topic?.title?.content ?? compData.title?.content)
      description ??= cleanCardText(topic?.subtitle?.content)
      subtitle ??= cleanCardText(compData.subtitle?.content)
    }

    // 目标 URL 与域名：优先取 browser destination 的 url_data
    const destinations = Object.values(data.destination_objects || {}) as any[]
    const browser = destinations.find(d => d?.type === 'browser') ?? destinations[0]
    const urlData = browser?.data?.url_data

    const images = mapCardMedia(data)
    const legacyMedia = Object.values(data.media_entities || {})[0] as any

    const declaredOrder: string[] = Array.isArray(data.components)
      ? data.components
      : []
    const cardType = typeof data.type === 'string'
      ? data.type
      : ''
    const isCarousel = cardType.startsWith('image_carousel')
    // image_* → 图片卡（单图按原图比例 / 多图轮播）；video_* → 视频卡
    const layout = isCarousel
      ? 'image_carousel' as const
      : cardType.startsWith('video_')
        ? 'video_card' as const
        : cardType.startsWith('image_') || images.length > 1
          ? 'image_card' as const
          : 'default' as const

    const isMediaComponent = (compData: any) =>
      Array.isArray(compData?.media_list) || !!(compData?.media || compData?.id || compData?.media_id)
    const mediaIndex = declaredOrder.findIndex(
      name => isMediaComponent(data.component_objects?.[name]?.data),
    )
    const detailsIndex = declaredOrder.findIndex((name) => {
      const compData = data.component_objects?.[name]?.data
      return !!(compData?.title || compData?.subtitle || compData?.topic_detail)
    })
    const mediaFirst = mediaIndex === -1 || detailsIndex === -1 || mediaIndex < detailsIndex
    const ctaLabel = mapCtaLabel(data.experiment_signals?.website_cta_card_label)

    return {
      title,
      description,
      // 域名优先取 url_data.vanity；老 details 布局回退 subtitle
      domain: urlData?.vanity ?? subtitle,
      url: urlData?.url,
      // 首图与轮播首帧保持一致，而非 media_entities 的对象首键
      imageUrl: images[0]?.url ?? legacyMedia?.media_url_https,
      layout,
      ...(images.length
        ? { images }
        : {}),
      ...(layout !== 'default'
        ? { mediaFirst }
        : {}),
      ...(ctaLabel
        ? { ctaLabel }
        : {}),
    }
  }
  catch {
    return null
  }
}

export function mapTwitterCard(
  cardData: any,
  jetfuelAttachment?: { payload?: string } | null,
): LinkPreviewCard | undefined {
  if (!cardData)
    return undefined

  // 数据归一化：无论是新旧结构，都提取出核心的 name 和 binding_values
  const legacy = cardData.legacy || cardData
  const name = legacy.name
  const bindingValues = legacy.binding_values

  if (!name || !Array.isArray(bindingValues))
    return undefined

  // 2. 将 binding_values 转为 Map 以便快速查找 (O(1))
  const bindings = new Map(bindingValues.map((v: any) => [v.key, v.value]))

  // 3. 基础字段提取
  let card: LinkPreviewCard = {
    type: name === 'player'
      ? 'summary_large_image'
      : name, // Player 统一视为大图卡片
    url: legacy.url || getStr(bindings, 'card_url') || '',
    title: getStr(bindings, 'title'),
    description: getStr(bindings, 'description'),
    domain: getStr(bindings, 'domain') || getStr(bindings, 'vanity_url'),
    imageUrl: getBestImage(bindings),
    // 布局标记：非 unified_card 直接视为普通卡；旧缓存无此字段用于触发回填
    layout: 'default',
  }

  // 4. 特殊处理 Unified Card (覆盖之前的提取)
  if (name === 'unified_card') {
    const unifiedData = parseUnifiedCard(getStr(bindings, 'unified_card'))
    if (unifiedData) {
      // 只覆盖非 undefined 字段，避免 description 等被 undefined 清空
      card = {
        ...card,
        ...Object.fromEntries(Object.entries(unifiedData).filter(([, v]) => v !== undefined)),
      }
    }
  }

  // 4.5 jetfuel 增强：解析 responsive_web_jetfuel_frame 附件数据（Trending/topic 卡全量）
  if (jetfuelAttachment?.payload) {
    const trending = parseTrendingCard(jetfuelAttachment.payload)
    if (trending) {
      // 优先使用 jetfuel 数据（官方渲染同源，含更新版描述/图片 + 分类/头像/posts 数）
      card = {
        ...card,
        url: trending.url || card.url,
        imageUrl: trending.imageUrl || card.imageUrl,
        title: trending.title || card.title,
        description: trending.description || card.description,
        domain: card.domain || getDomainFromUrl(trending.url) || '',
        layout: 'trending',
        trending,
      }
    }
    else {
      // 解析失败：回退 unified_card 结果，并提示开发者 payload 结构已变更
      obsLog('jetfuel.parse.fallback', {
        card: name,
        payloadHash: hashPayload(jetfuelAttachment.payload),
        reason: 'payload did not yield url/image/title',
      })
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

/** 轻量 payload 指纹（前 8B base64），用于日志中标识结构版本 */
function hashPayload(payload: string): string {
  const head = Buffer.from(payload.slice(0, 12), 'base64')
  return Array.from(head.subarray(0, 8)).map(x => x.toString(16).padStart(2, '0')).join('')
}

function getDomainFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname
  }
  catch {
    return null
  }
}

export function mapMediaDetails(tweet: RawTweet): MediaDetails[] | undefined {
  const mediaEntities = tweet.legacy.entities?.media
  if (!mediaEntities || mediaEntities.length === 0)
    return undefined

  const noteMedia = tweet.note_tweet?.note_tweet_results?.result?.media?.inline_media || []

  return mediaEntities.map((media, idx) => {
    const mediaNoteIdx = noteMedia.findIndex(m => m.media_id === media.id_str)
    const mediaIdx = mediaNoteIdx === -1
      ? idx
      : mediaNoteIdx

    const baseMedia = {
      index: mediaIdx,
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
          duration: media.video_info.duration_millis || 0,
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
          duration: media.video_info.duration_millis || 0,
          aspect_ratio: [
            media.video_info.aspect_ratio[0] || 1,
            media.video_info.aspect_ratio[1] || 1,
          ] as [number, number],
          variants: [
            media.video_info.variants.at(-1)!,
          ],
        },
      }
    }

    // Fallback: 默认返回 photo 类型以保证类型安全
    return {
      ...baseMedia,
      type: 'photo' as const,
    }
  })
    .sort((a, b) => a.index - b.index)
}
