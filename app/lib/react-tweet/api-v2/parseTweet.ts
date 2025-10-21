import type {
  EnrichedTweet,
  Entity,
  EntityWithType,
  HashtagEntity,
  MediaDetails,
  RawTweet,
  SymbolEntity,
  TweetPhoto,
  TweetUser,
  TweetVideo,
  TwitterCard,
} from './types'

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
    possibly_sensitive: tweet.legacy.possibly_sensitive ?? false,
    text,
    user,
    like_url: likeUrl,
    reply_url: replyUrl,
    in_reply_to_url: tweet.in_reply_to_screen_name
      ? inReplyToUrl
      : undefined,
    in_reply_to_status_id_str: tweet.legacy.in_reply_to_status_id_str,
    entities: getEntities(tweet, text),
    quoted_tweet: tweet.quoted_status_result
      ? enrichTweet(tweet.quoted_status_result.result)
      : undefined,
    card: mapTwitterCard(tweet.card),
    mediaDetails: mapMediaDetails(tweet),
    photos: mapPhotoEntities(tweet),
    video: mapVideoEntities(tweet),
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
  const entities = tweet.legacy.entities
  const noteEntities = tweet.note_tweet?.note_tweet_results?.result.entity_set

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
      // 跳过在句首 mention 范围内的 hashtag
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
      if (mention.indices[0] >= leadingMentionEndIndex) {
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
      if (mention.indices[0] >= leadingMentionEndIndex) {
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
      // 跳过在句首 mention 范围内的 url
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
      // 跳过在句首 mention 范围内的 url
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
      // 跳过在句首 mention 范围内的 media
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
      // 跳过在句首 mention 范围内的 symbol
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
      // 跳过在句首 mention 范围内的 symbol
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
  return result.map((entity) => {
    const entityText = adjustedTextMap.slice(entity.indices[0], entity.indices[1]).join('')

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
          text: (entity as any).expanded_url,
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
  if (!cardData)
    return undefined

  // Handle the new card structure with rest_id and legacy
  if (cardData.rest_id && cardData.legacy) {
    const { rest_id, legacy } = cardData
    const { binding_values, name, url, card_platform, user_refs_results } = legacy

    const card: TwitterCard = {
      rest_id,
      legacy: {
        binding_values,
        card_platform,
        name,
        url,
        user_refs_results,
      },
    }

    // Process binding_values for easier access
    if (binding_values && Array.isArray(binding_values)) {
      const bindingMap = new Map()
      binding_values.forEach((item) => {
        bindingMap.set(item.key, item.value)
      })

      // Extract basic information
      const title = bindingMap.get('title')?.string_value
      const description = bindingMap.get('description')?.string_value
      const domain = bindingMap.get('domain')?.string_value || bindingMap.get('vanity_url')?.string_value

      if (title)
        card.title = title
      if (description)
        card.description = description
      if (domain)
        card.domain = domain
      if (name)
        card.type = name as any
      if (url)
        card.url = url

      // Handle images based on card type
      if (name === 'summary_large_image') {
        const images: TwitterCard['images'] = {}

        // Map different image sizes
        const imageKeys = [
          { key: 'photo_image_full_size_small', size: 'small' },
          { key: 'summary_photo_image_small', size: 'small' },
          { key: 'photo_image_full_size', size: 'medium' },
          { key: 'summary_photo_image', size: 'medium' },
          { key: 'photo_image_full_size_large', size: 'large' },
          { key: 'summary_photo_image_large', size: 'large' },
          { key: 'photo_image_full_size_original', size: 'original' },
          { key: 'summary_photo_image_original', size: 'original' },
          { key: 'photo_image_full_size_x_large', size: 'x_large' },
          { key: 'summary_photo_image_x_large', size: 'x_large' },
        ]

        imageKeys.forEach(({ key, size }) => {
          const imageValue = bindingMap.get(key)?.image_value
          if (imageValue) {
            const imageSize = size === 'x_large' ? 'original' : size as keyof NonNullable<TwitterCard['images']>
            if (!images[imageSize]) {
              images[imageSize] = {
                url: imageValue.url,
                width: imageValue.width,
                height: imageValue.height,
              }
            }
          }
        })

        if (Object.keys(images).length > 0) {
          card.images = images
          // Set primary image to the largest available
          card.image = images.original || images.large || images.medium || images.small
        }
      }
      else if (name === 'summary') {
        const images: TwitterCard['images'] = {}

        // Handle regular summary card images
        const thumbnailKeys = [
          { key: 'thumbnail_image_small', size: 'small' },
          { key: 'thumbnail_image', size: 'medium' },
          { key: 'thumbnail_image_large', size: 'large' },
          { key: 'thumbnail_image_original', size: 'original' },
          { key: 'thumbnail_image_x_large', size: 'x_large' },
        ]

        thumbnailKeys.forEach(({ key, size }) => {
          const imageValue = bindingMap.get(key)?.image_value
          if (imageValue) {
            const imageSize = size === 'x_large' ? 'original' : size as keyof NonNullable<TwitterCard['images']>
            if (!images[imageSize]) {
              images[imageSize] = {
                url: imageValue.url,
                width: imageValue.width,
                height: imageValue.height,
              }
            }
          }
        })

        if (Object.keys(images).length > 0) {
          card.images = images
          card.image = images.original || images.large || images.medium || images.small
        }
      }
      else if (name === 'player') {
        const images: TwitterCard['images'] = {}

        // Handle player card images
        const playerImageKeys = [
          { key: 'player_image_small', size: 'small' },
          { key: 'player_image', size: 'medium' },
          { key: 'player_image_large', size: 'large' },
          { key: 'player_image_original', size: 'original' },
          { key: 'player_image_x_large', size: 'x_large' },
        ]

        playerImageKeys.forEach(({ key, size }) => {
          const imageValue = bindingMap.get(key)?.image_value
          if (imageValue) {
            const imageSize = size === 'x_large' ? 'original' : size as keyof NonNullable<TwitterCard['images']>
            if (!images[imageSize]) {
              images[imageSize] = {
                url: imageValue.url,
                width: imageValue.width,
                height: imageValue.height,
              }
            }
          }
        })

        if (Object.keys(images).length > 0) {
          card.images = images
          card.image = images.original || images.large || images.medium || images.small
        }

        // Convert player type to summary_large_image for consistent rendering
        card.type = 'summary_large_image'
      }
      else if (name === 'unified_card') {
        // Handle unified_card type (YouTube, etc.)
        const unifiedCardValue = bindingMap.get('unified_card')?.string_value
        if (unifiedCardValue) {
          try {
            const unifiedData = JSON.parse(unifiedCardValue)

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

                // Also create images object with different sizes if available
                if (media.sizes) {
                  const images: TwitterCard['images'] = {}

                  if (media.sizes.small) {
                    images.small = {
                      url: media.media_url_https,
                      width: media.sizes.small.w,
                      height: media.sizes.small.h,
                    }
                  }

                  if (media.sizes.medium) {
                    images.medium = {
                      url: media.media_url_https,
                      width: media.sizes.medium.w,
                      height: media.sizes.medium.h,
                    }
                  }

                  if (media.sizes.large) {
                    images.large = {
                      url: media.media_url_https,
                      width: media.sizes.large.w,
                      height: media.sizes.large.h,
                    }
                  }

                  // Use original_info for original size
                  images.original = {
                    url: media.media_url_https,
                    width: media.original_info.width,
                    height: media.original_info.height,
                  }

                  card.images = images
                }
              }
            }
          }
          catch (e) {
            // Ignore JSON parse errors
          }
        }
      }
    }

    return card
  }

  // Fallback for old card structure
  if (!cardData.name)
    return undefined

  const { name, url, binding_values } = cardData
  const card: TwitterCard = {
    type: name,
    url: url || '',
  }

  if (!binding_values)
    return card

  // Extract basic information (old structure)
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

  if (card.type === 'player') {
    card.image = binding_values.player_image_original?.image_value
    card.type = 'summary_large_image'
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

function mapMediaDetails(tweet: RawTweet): MediaDetails[] | undefined {
  const mediaEntities = tweet.legacy.entities?.media
  if (!mediaEntities || mediaEntities.length === 0)
    return undefined

  return mediaEntities.map((media) => {
    const baseMedia = {
      display_url: media.display_url,
      expanded_url: media.expanded_url,
      ext_media_availability: {
        status: media.ext_media_availability?.status || 'Available',
      },
      ext_media_color: {
        palette: [],
      },
      indices: media.indices,
      media_url_https: media.media_url_https,
      original_info: {
        height: media.original_info.height,
        width: media.original_info.width,
        focus_rects: media.original_info.focus_rects || [],
      },
      sizes: {
        large: {
          h: media.sizes.large.h,
          resize: media.sizes.large.resize,
          w: media.sizes.large.w,
        },
        medium: {
          h: media.sizes.medium.h,
          resize: media.sizes.medium.resize,
          w: media.sizes.medium.w,
        },
        small: {
          h: media.sizes.small.h,
          resize: media.sizes.small.resize,
          w: media.sizes.small.w,
        },
        thumb: {
          h: media.sizes.thumb.h,
          resize: media.sizes.thumb.resize,
          w: media.sizes.thumb.w,
        },
      },
      url: media.url,
    }

    if (media.type === 'photo') {
      return {
        ...baseMedia,
        type: 'photo' as const,
        ext_alt_text: media.ext_alt_text,
      }
    }
    else if (media.type === 'animated_gif' && media.video_info) {
      return {
        ...baseMedia,
        type: 'animated_gif' as const,
        video_info: {
          aspect_ratio: [media.video_info.aspect_ratio[0] || 1, media.video_info.aspect_ratio[1] || 1] as [number, number],
          variants: media.video_info.variants,
        },
      }
    }
    else if (media.type === 'video' && media.video_info) {
      return {
        ...baseMedia,
        type: 'video' as const,
        video_info: {
          aspect_ratio: [media.video_info.aspect_ratio[0] || 1, media.video_info.aspect_ratio[1] || 1] as [number, number],
          variants: media.video_info.variants,
        },
      }
    }

    // 默认返回 photo 类型
    return {
      ...baseMedia,
      type: 'photo' as const,
    }
  })
}
