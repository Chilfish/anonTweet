import type { EnrichedTweet, Entity, EntityWithType, HashtagEntity, RawTweet, SymbolEntity, TweetUser, TwitterCard } from './types'
import type { TweetParent } from './types/tweet'

/**
 * Enriches a tweet with additional data used to more easily use the tweet in a UI.
 */
export function enrichTweet(tweet: RawTweet): EnrichedTweet {
  const userBase = transformUserResponse(tweet)
  const userScreenName = userBase.screen_name
  const user = {
    ...userBase,
    url: `https://twitter.com/${userScreenName}`,
    follow_url: `https://twitter.com/intent/follow?screen_name=${userScreenName}`,
  }

  const tweetId = tweet.rest_id
  const tweetUrl = `https://twitter.com/${userScreenName}/status/${tweetId}`
  const likeUrl = `https://twitter.com/i/activity/like?tweet_id=${tweetId}`
  const replyUrl = `https://twitter.com/${userScreenName}/status/${tweetId}`
  const inReplyToUrl = `https://x.com/${tweet.in_reply_to_screen_name}/status/${tweet.in_reply_to_status_id_str}`

  const text = tweet.note_tweet?.note_tweet_results?.result?.text || tweet.legacy.full_text

  return {
    id_str: tweet.rest_id,
    lang: tweet.legacy.lang,
    url: tweetUrl,
    favorite_count: tweet.legacy.favorite_count,
    created_at: tweet.legacy.created_at,
    conversation_count: tweet.legacy.reply_count,
    edit_control: {
      edit_tweet_ids: tweet.edit_control.edit_tweet_ids,
      editable_until_msecs: tweet.edit_control.editable_until_msecs,
      is_edit_eligible: tweet.edit_control.is_edit_eligible,
      edits_remaining: tweet.edit_control.edits_remaining,
    },
    news_action_type: 'conversation',
    display_text_range: tweet.legacy.display_text_range as [number, number],
    __typename: 'Tweet',
    isEdited: false,
    isStaleEdit: false,
    text,
    user,
    like_url: likeUrl,
    reply_url: replyUrl,
    in_reply_to_url: tweet.in_reply_to_screen_name
      ? inReplyToUrl
      : undefined,
    entities: getEntities(tweet, text),
    quoted_tweet: tweet.quoted_status_result
      ? enrichTweet(tweet.quoted_status_result.result)
      : undefined,
    card: mapTwitterCard(tweet.card),
    photos: mapPhotoEntities(tweet),
    video: mapVideoEntities(tweet),
    parent: parentTweet(tweet),
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
  const textMap = Array.from(text)
  const result: EntityWithType[] = []

  // 获取实体数据源
  const entities = tweet.legacy.entities
  const noteEntities = tweet.note_tweet?.note_tweet_results?.result.entity_set

  // 收集所有实体
  const allEntities: EntityWithType[] = []

  // 处理 hashtags
  if (entities.hashtags) {
    entities.hashtags.forEach((hashtag) => {
      allEntities.push({
        ...hashtag,
        type: 'hashtag',
      })
    })
  }

  // 处理 note_tweet 中的 hashtags
  if (noteEntities?.hashtags) {
    noteEntities.hashtags.forEach((hashtag) => {
      allEntities.push({
        text: hashtag.text,
        indices: hashtag.indices,
        type: 'hashtag',
      })
    })
  }

  // 处理 user_mentions
  if (entities.user_mentions) {
    entities.user_mentions.forEach((mention) => {
      allEntities.push({
        ...mention,
        type: 'mention',
      })
    })
  }

  // 处理 note_tweet 中的 user_mentions
  if (noteEntities?.user_mentions) {
    noteEntities.user_mentions.forEach((mention) => {
      allEntities.push({
        id_str: mention.id_str,
        name: mention.name,
        screen_name: mention.screen_name,
        indices: mention.indices,
        type: 'mention',
      })
    })
  }

  // 处理 urls
  if (entities.urls) {
    entities.urls.forEach((url) => {
      allEntities.push({
        ...url,
        type: 'url',
      })
    })
  }

  // 处理 note_tweet 中的 urls
  if (noteEntities?.urls) {
    noteEntities.urls.forEach((url) => {
      allEntities.push({
        display_url: url.display_url,
        expanded_url: url.expanded_url,
        url: url.url,
        indices: url.indices,
        type: 'url',
      })
    })
  }

  // 处理 media
  if (entities.media) {
    entities.media.forEach((media) => {
      allEntities.push({
        display_url: media.display_url,
        expanded_url: media.expanded_url,
        url: media.url,
        indices: media.indices,
        type: 'media',
      })
    })
  }

  // 处理 symbols
  if (entities.symbols) {
    entities.symbols.forEach((symbol) => {
      allEntities.push({
        ...symbol,
        type: 'symbol',
      })
    })
  }

  // 处理 note_tweet 中的 symbols
  if (noteEntities?.symbols) {
    noteEntities.symbols.forEach((symbol) => {
      allEntities.push({
        text: symbol.text,
        indices: symbol.indices,
        type: 'symbol',
      })
    })
  }

  // 按索引排序
  allEntities.sort((a, b) => a.indices[0] - b.indices[0])

  // 创建文本片段
  const displayTextRange = tweet.legacy.display_text_range as [number, number]
  let currentIndex = displayTextRange[0]

  allEntities.forEach((entity) => {
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
  if (currentIndex < displayTextRange[1]) {
    result.push({
      indices: [currentIndex, displayTextRange[1]] as [number, number],
      type: 'text',
    })
  }

  // 转换为最终的 Entity 类型
  return result.map((entity) => {
    const entityText = textMap.slice(entity.indices[0], entity.indices[1]).join('')

    switch (entity.type) {
      case 'hashtag':
        return Object.assign(entity, {
          href: getHashtagUrl(entity as HashtagEntity),
          text: entityText,
        })
      case 'mention':
        return Object.assign(entity, {
          href: `https://twitter.com/${(entity as any).screen_name}`,
          text: entityText,
        })
      case 'url':
      case 'media':
        return Object.assign(entity, {
          href: (entity as any).expanded_url,
          text: (entity as any).display_url,
        })
      case 'symbol':
        return Object.assign(entity, {
          href: getSymbolUrl(entity as SymbolEntity),
          text: entityText,
        })
      default:
        return Object.assign(entity, { text: entityText })
    }
  })
}

function getHashtagUrl(hashtag: HashtagEntity) {
  return `https://x.com/hashtag/${hashtag.text}`
}

function getSymbolUrl(symbol: SymbolEntity) {
  return `https://x.com/search?q=%24${symbol.text}`
}

/**
 * Maps raw Twitter card data to a clean TwitterCard interface
 */
export function mapTwitterCard(cardData: any): TwitterCard | undefined {
  if (!cardData || !cardData.name)
    return undefined

  const { name, url, binding_values } = cardData
  const card: TwitterCard = {
    type: name,
    url: url || '',
  }

  if (!binding_values)
    return card

  // Extract basic information
  if (binding_values.title?.string_value) {
    card.title = binding_values.title.string_value
  }

  if (binding_values.description?.string_value) {
    card.description = binding_values.description.string_value
  }

  if (binding_values.domain?.string_value) {
    card.domain = binding_values.domain.string_value
  }

  // Handle unified_card type (YouTube, etc.)
  if (name === 'unified_card' && binding_values.unified_card?.string_value) {
    try {
      const unifiedData = JSON.parse(binding_values.unified_card.string_value)

      // Extract title and domain from unified card
      if (unifiedData.component_objects?.details_1?.data?.title?.content) {
        card.title = unifiedData.component_objects.details_1.data.title.content
      }

      if (unifiedData.component_objects?.details_1?.data?.subtitle?.content) {
        card.domain = unifiedData.component_objects.details_1.data.subtitle.content
      }

      // Extract URL from destination
      if (unifiedData.destination_objects?.browser_1?.data?.url_data?.url) {
        card.url = unifiedData.destination_objects.browser_1.data.url_data.url
      }

      // Extract image from media entities
      const mediaEntities = unifiedData.media_entities
      if (mediaEntities) {
        const firstMediaKey = Object.keys(mediaEntities)[0]
        const media = mediaEntities[firstMediaKey]
        if (media?.media_url_https && media.original_info) {
          card.image = {
            url: media.media_url_https,
            width: media.original_info.width,
            height: media.original_info.height,
          }
        }
      }
    }
    catch (e) {
      // Ignore JSON parse errors
    }
  }

  // Handle summary and summary_large_image card images
  if (name === 'summary' || name === 'summary_large_image') {
    const images: TwitterCard['images'] = {}

    // For summary_large_image, we need to handle different image field names
    if (name === 'summary_large_image') {
      // Map summary_large_image specific fields
      if (binding_values.photo_image_full_size_small?.image_value || binding_values.summary_photo_image_small?.image_value) {
        const img = binding_values.photo_image_full_size_small?.image_value || binding_values.summary_photo_image_small?.image_value
        images.small = { url: img.url, width: img.width, height: img.height }
      }

      if (binding_values.photo_image_full_size?.image_value || binding_values.summary_photo_image?.image_value) {
        const img = binding_values.photo_image_full_size?.image_value || binding_values.summary_photo_image?.image_value
        images.medium = { url: img.url, width: img.width, height: img.height }
      }

      if (binding_values.photo_image_full_size_large?.image_value || binding_values.summary_photo_image_large?.image_value) {
        const img = binding_values.photo_image_full_size_large?.image_value || binding_values.summary_photo_image_large?.image_value
        images.large = { url: img.url, width: img.width, height: img.height }
      }

      if (binding_values.photo_image_full_size_original?.image_value || binding_values.summary_photo_image_original?.image_value) {
        const img = binding_values.photo_image_full_size_original?.image_value || binding_values.summary_photo_image_original?.image_value
        images.original = { url: img.url, width: img.width, height: img.height }
      }

      // Also check for x_large variants
      if (binding_values.photo_image_full_size_x_large?.image_value || binding_values.summary_photo_image_x_large?.image_value) {
        const img = binding_values.photo_image_full_size_x_large?.image_value || binding_values.summary_photo_image_x_large?.image_value
        // Use x_large as original if original is not available
        if (!images.original) {
          images.original = { url: img.url, width: img.width, height: img.height }
        }
      }
    }
    else {
      // Handle regular summary card images
      if (binding_values.thumbnail_image_small?.image_value) {
        const img = binding_values.thumbnail_image_small.image_value
        images.small = { url: img.url, width: img.width, height: img.height }
      }

      if (binding_values.thumbnail_image?.image_value) {
        const img = binding_values.thumbnail_image.image_value
        images.medium = { url: img.url, width: img.width, height: img.height }
      }

      if (binding_values.thumbnail_image_large?.image_value) {
        const img = binding_values.thumbnail_image_large.image_value
        images.large = { url: img.url, width: img.width, height: img.height }
      }

      if (binding_values.thumbnail_image_original?.image_value) {
        const img = binding_values.thumbnail_image_original.image_value
        images.original = { url: img.url, width: img.width, height: img.height }
      }
    }

    if (Object.keys(images).length > 0) {
      card.images = images
      // Set primary image to the largest available
      card.image = images.original || images.large || images.medium || images.small
    }
  }

  if (card.type === 'player') {
    card.image = binding_values.player_image_original?.image_value
    card.type = 'summary_large_image'
  }

  return card
}

function mapPhotoEntities(tweet: RawTweet): import('./types').TweetPhoto[] | undefined {
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

function mapVideoEntities(tweet: RawTweet): import('./types').TweetVideo | undefined {
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

function parentTweet(tweet: RawTweet): TweetParent | undefined {
  // throw new Error('Function not implemented.')
}
