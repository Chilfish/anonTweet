import type {
  EnrichedTweet,
  Entity,
  EntityWithType,
  HashtagEntity,
  LinkPreviewCard,
  MediaDetails,
  RawTweet,
  SymbolEntity,
  TweetPhoto,
  TweetUser,
  TweetVideo,
} from './types'

/**
 * Enriches a tweet with additional data used to more easily use the tweet in a UI.
 */
export function enrichTweet(sourceData: RawTweet): EnrichedTweet {
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
    favorite_count: tweet.legacy.favorite_count,
    created_at: tweet.legacy.created_at,
    conversation_count: tweet.legacy.reply_count,
    display_text_range: tweet.legacy.display_text_range as [number, number],
    __typename: 'Tweet',
    text,
    user,
    in_reply_to_status_id_str: tweet.legacy.in_reply_to_status_id_str,
    entities: getEntities(tweet, text),
    quoted_tweet_id: tweet.quoted_status_result?.result?.rest_id,
    // quoted_tweet: tweet.quoted_status_result?.result
    //   ? enrichTweet(tweet.quoted_status_result.result)
    //   : undefined,
    card: mapTwitterCard(tweet.card),
    mediaDetails: mapMediaDetails(tweet),
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
    name: legacy.name,
    screen_name: legacy.screen_name,
    is_blue_verified: RawTweet.is_blue_verified,
    profile_image_shape: RawTweet.profile_image_shape as TweetUser['profile_image_shape'],
    verified: legacy.verified,
    // @ts-expect-error: The verified_type is not always defined
    verified_type: legacy.verified_type,
    profile_image_url_https: legacy.profile_image_url_https,
  }

  return transformedUser
}

function getEntities(tweet: RawTweet, text: string): Entity[] {
  const result: EntityWithType[] = []

  // 获取实体数据源
  const entities = tweet.legacy.entities || []
  const noteEntities = tweet.note_tweet?.note_tweet_results?.result.entity_set || []

  // 收集所有实体
  const allEntities: EntityWithType[] = []

  // 检查文本开头是否有 mention，如果有则记录需要移除的范围
  const leadingMentionMatch = text.match(/^(@\w{1,15}\s*)+/)
  const leadingMentionEndIndex = leadingMentionMatch ? leadingMentionMatch[0].length : 0

  // 用于去重的 Set，基于 indices 位置
  const entityIndicesSet = new Set<string>()

  // 辅助函数：添加实体并去重
  const addEntityIfUnique = (entity: EntityWithType) => {
    const indicesKey = `${entity.indices[0]}-${entity.indices[1]}-${entity.type}`
    if (!entityIndicesSet.has(indicesKey)) {
      entityIndicesSet.add(indicesKey)
      allEntities.push(entity)
    }
  }

  // 处理 hashtags
  if (entities.hashtags) {
    entities.hashtags.forEach((hashtag) => {
      if (hashtag.indices[0] >= leadingMentionEndIndex) {
        addEntityIfUnique({
          ...hashtag,
          type: 'hashtag',
          // 调整索引位置
          indices: [hashtag.indices[0] - leadingMentionEndIndex, hashtag.indices[1] - leadingMentionEndIndex] as [number, number],
        })
      }
    })
  }

  // 处理 note_tweet 中的 hashtags
  if (noteEntities?.hashtags) {
    noteEntities.hashtags.forEach((hashtag) => {
      // 跳过在句首 mention 范围内的 hashtag
      if (hashtag.indices[0] >= leadingMentionEndIndex) {
        addEntityIfUnique({
          text: hashtag.text,
          indices: [hashtag.indices[0] - leadingMentionEndIndex, hashtag.indices[1] - leadingMentionEndIndex] as [number, number],
          type: 'hashtag',
        })
      }
    })
  }

  // 处理 user_mentions
  if (entities.user_mentions) {
    entities.user_mentions.forEach((mention) => {
      // 跳过在句首 mention 范围内的 mention
      if (mention.indices[0] > leadingMentionEndIndex) {
        addEntityIfUnique({
          ...mention,
          type: 'mention',
          // 调整索引位置
          indices: [mention.indices[0] - leadingMentionEndIndex, mention.indices[1] - leadingMentionEndIndex] as [number, number],
        })
      }
    })
  }

  // 处理 note_tweet 中的 user_mentions
  if (noteEntities?.user_mentions) {
    noteEntities.user_mentions.forEach((mention) => {
      // 跳过在句首 mention 范围内的 mention
      if (mention.indices[0] > leadingMentionEndIndex) {
        addEntityIfUnique({
          id_str: mention.id_str,
          name: mention.name,
          screen_name: mention.screen_name,
          indices: [mention.indices[0] - leadingMentionEndIndex, mention.indices[1] - leadingMentionEndIndex] as [number, number],
          type: 'mention',
        })
      }
    })
  }

  // 处理 urls
  if (entities.urls) {
    entities.urls.forEach((url) => {
      if (url.indices[0] >= leadingMentionEndIndex) {
        addEntityIfUnique({
          ...url,
          type: 'url',
          // 调整索引位置
          indices: [url.indices[0] - leadingMentionEndIndex, url.indices[1] - leadingMentionEndIndex] as [number, number],
        })
      }
    })
  }

  // 处理 note_tweet 中的 urls
  if (noteEntities?.urls) {
    noteEntities.urls.forEach((url) => {
      if (url.indices[0] >= leadingMentionEndIndex) {
        addEntityIfUnique({
          display_url: url.display_url,
          expanded_url: url.expanded_url,
          url: url.url,
          indices: [url.indices[0] - leadingMentionEndIndex, url.indices[1] - leadingMentionEndIndex] as [number, number],
          type: 'url',
        })
      }
    })
  }

  // 处理 media
  if (entities.media) {
    entities.media.forEach((media) => {
      if (media.indices[0] >= leadingMentionEndIndex) {
        addEntityIfUnique({
          display_url: media.display_url,
          expanded_url: media.expanded_url,
          url: media.url,
          // media 不占用文本范围，所以设置为 [0, 0]
          indices: [0, 0],
          type: 'media',
        })
      }
    })
  }

  // 处理 symbols
  if (entities.symbols) {
    entities.symbols.forEach((symbol) => {
      if (symbol.indices[0] >= leadingMentionEndIndex) {
        addEntityIfUnique({
          ...symbol,
          type: 'symbol',
          // 调整索引位置
          indices: [symbol.indices[0] - leadingMentionEndIndex, symbol.indices[1] - leadingMentionEndIndex] as [number, number],
        })
      }
    })
  }

  // 处理 note_tweet 中的 symbols
  if (noteEntities?.symbols) {
    noteEntities.symbols.forEach((symbol) => {
      if (symbol.indices[0] >= leadingMentionEndIndex) {
        addEntityIfUnique({
          text: symbol.text,
          indices: [symbol.indices[0] - leadingMentionEndIndex, symbol.indices[1] - leadingMentionEndIndex] as [number, number],
          type: 'symbol',
        })
      }
    })
  }

  // 按索引排序，但将 media 类型的实体排到最后（因为它们不占用文本位置）
  allEntities.sort((a, b) => {
    if (a.type === 'media' && b.type !== 'media')
      return 1
    if (a.type !== 'media' && b.type === 'media')
      return -1
    return a.indices[0] - b.indices[0]
  })

  // 移除句首 mention 后调整文本范围
  const displayTextRange = tweet.legacy.display_text_range as [number, number]

  // 如果使用的是 note_tweet 的文本，应该使用完整文本长度
  const isUsingNoteText = tweet.note_tweet?.note_tweet_results?.result?.text === text

  const adjustedTextRange: [number, number] = isUsingNoteText
    ? [
        Math.max(0, 0 - leadingMentionEndIndex), // note_tweet 从头开始
        text.length - leadingMentionEndIndex, // 使用完整文本长度
      ]
    : [
        Math.max(0, displayTextRange[0] - leadingMentionEndIndex),
        displayTextRange[1] - leadingMentionEndIndex,
      ]

  let currentIndex = adjustedTextRange[0]

  // 只处理非 media 类型的实体来构建文本片段
  const textEntities = allEntities.filter(entity => entity.type !== 'media')

  textEntities.forEach((entity) => {
    // 添加实体前的文本
    if (currentIndex < entity.indices[0]) {
      result.push({
        indices: [currentIndex, entity.indices[0]] as [number, number],
        type: 'text',
      })
    }

    // 添加实体
    result.push(entity)
    currentIndex = entity.indices[1]
  })

  // 添加最后的文本片段
  if (currentIndex < adjustedTextRange[1]) {
    result.push({
      indices: [currentIndex, adjustedTextRange[1]] as [number, number],
      type: 'text',
    })
  }

  // 添加 media 实体到结果中
  const mediaEntities = allEntities.filter(entity => entity.type === 'media')
  result.push(...mediaEntities)

  // 移除句首 mention 后的文本
  const adjustedText = text.slice(leadingMentionEndIndex)
  const adjustedTextMap = Array.from(adjustedText)

  // 转换为最终的 Entity 类型
  return result.map((entity, index) => {
    const entityText = adjustedTextMap.slice(entity.indices[0], entity.indices[1]).join('')

    switch (entity.type) {
      case 'hashtag':
        return Object.assign(entity, {
          href: getHashtagUrl(entity as HashtagEntity),
          text: entityText,
          index,
        })
      case 'mention':
        return Object.assign(entity, {
          href: `https://twitter.com/${(entity as any).screen_name}`,
          text: entityText,
          index,
        })
      case 'url':
      case 'media':
        return Object.assign(entity, {
          href: (entity as any).expanded_url,
          text: (entity as any).expanded_url,
          index,
        })
      case 'symbol':
        return Object.assign(entity, {
          href: getSymbolUrl(entity as SymbolEntity),
          text: entityText,
          index,
        })
      default:
        return Object.assign(entity, { text: entityText, index })
    }
  })
}

function getHashtagUrl(hashtag: HashtagEntity) {
  return `https://x.com/hashtag/${hashtag.text}`
}

function getSymbolUrl(symbol: SymbolEntity) {
  return `https://x.com/search?q=%24${symbol.text}`
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

function mapPhotoEntities(tweet: RawTweet): TweetPhoto[] | undefined {
  const mediaEntities = tweet.legacy.entities.media || tweet.legacy.extended_entities?.media

  if (!mediaEntities) {
    return undefined
  }

  const photos = mediaEntities.filter(media => media.type === 'photo')

  if (photos.length === 0) {
    return undefined
  }

  return photos.map(photo => ({
    backgroundColor: {
      red: 0,
      green: 0,
      blue: 0,
    },
    cropCandidates: photo.original_info?.focus_rects || [],
    expandedUrl: photo.expanded_url,
    url: photo.media_url_https,
    width: photo.original_info?.width || photo.sizes?.large?.w || 0,
    height: photo.original_info?.height || photo.sizes?.large?.h || 0,
  }))
}

function mapVideoEntities(tweet: RawTweet): TweetVideo | undefined {
  const mediaEntities = tweet.legacy.entities.media || tweet.legacy.extended_entities?.media

  if (!mediaEntities) {
    return undefined
  }

  const video = mediaEntities.find(media => media.type === 'video')

  if (!video || !video.video_info) {
    return undefined
  }

  return {
    aspectRatio: video.video_info.aspect_ratio as [number, number],
    contentType: 'video/mp4',
    durationMs: video.video_info.duration_millis || 0,
    mediaAvailability: {
      status: video.ext_media_availability?.status || 'Available',
    },
    poster: video.media_url_https,
    variants: video.video_info.variants.map(variant => ({
      type: variant.content_type,
      src: variant.url,
    })),
    videoId: {
      type: 'tweet',
      id: video.id_str || '',
    },
    viewCount: 0,
  }
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
