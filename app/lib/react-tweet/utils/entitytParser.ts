import type { Entity, EntityWithType, RawTweet, SeparatorEntity } from '~/types'

// 用于 AI 交互的载荷
export interface TranslationPayload {
  maskedText: string
  entityMap: Map<string, Entity>
}

interface InternalEntityRange {
  type: EntityWithType['type']
  indices: [number, number]
  data: any
}

function extractRanges(tweet: RawTweet, leadingMentionEndIndex: number): InternalEntityRange[] {
  const ranges: InternalEntityRange[] = []
  const entitySet = new Set<string>()

  const addRange = (source: any, type: EntityWithType['type']) => {
    if (!source || !source.indices)
      return

    const rawIndices = source.indices as [number, number]
    if (rawIndices[1] <= leadingMentionEndIndex)
      return

    // Media 特殊处理：逻辑长度为0，不参与文本切分
    const effectiveIndices: [number, number] = type === 'media'
      ? [0, 0]
      : [
          Math.max(0, rawIndices[0] - leadingMentionEndIndex),
          Math.max(0, rawIndices[1] - leadingMentionEndIndex),
        ]

    const key = `${effectiveIndices[0]}-${effectiveIndices[1]}-${type}`
    if (entitySet.has(key))
      return
    entitySet.add(key)

    ranges.push({
      type,
      indices: effectiveIndices,
      data: { ...source, type },
    })
  }

  const legacy = tweet.legacy.entities
  const note = tweet.note_tweet?.note_tweet_results?.result.entity_set

  const processSource = (source: any) => {
    if (!source)
      return
    source.hashtags?.forEach((e: any) => addRange(e, 'hashtag'))
    source.user_mentions?.forEach((e: any) => addRange(e, 'mention'))
    source.urls?.forEach((e: any) => addRange(e, 'url'))
    source.symbols?.forEach((e: any) => addRange(e, 'symbol'))
    source.media?.forEach((e: any) => addRange(e, 'media'))
  }

  if (note)
    processSource(note)
  else processSource(legacy)

  return ranges.sort((a, b) => a.indices[0] - b.indices[0])
}

function createFinalEntity(base: any, text: string, index: number): Entity {
  const common = { index, text }
  // 移除 indices 字段，只保留业务数据
  const { indices, ...cleanBase } = base

  switch (base.type) {
    case 'hashtag':
      return { ...cleanBase, ...common, href: `https://twitter.com/hashtag/${base.text}` }
    case 'mention':
      return { ...cleanBase, ...common, href: `https://twitter.com/${base.screen_name}` }
    case 'url':
    case 'media':
      return { ...cleanBase, ...common, href: base.expanded_url, text: base.display_url || text }
    case 'symbol':
      return { ...cleanBase, ...common, href: `https://twitter.com/search?q=%24${base.text}` }
    default:
      return { ...cleanBase, ...common }
  }
}

export function getEntities(tweet: RawTweet, rawText: string): Entity[] {
  const leadingMentionMatch = rawText.match(/^(@\w{1,15}\s*)+/)
  const leadingMentionEndIndex = leadingMentionMatch ? leadingMentionMatch[0].length : 0
  const displayText = rawText.slice(leadingMentionEndIndex)

  const ranges = extractRanges(tweet, leadingMentionEndIndex)
  const result: Entity[] = []
  let cursor = 0
  const textChars = Array.from(displayText)

  const textRanges = ranges.filter(r => r.type !== 'media')

  for (const range of textRanges) {
    const [start, end] = range.indices

    // 填充纯文本片段
    if (cursor < start) {
      const textSegment = textChars.slice(cursor, start).join('')
      if (textSegment) {
        result.push({
          type: 'text',
          text: textSegment,
          index: result.length,
        })
      }
    }

    // 处理功能性实体
    const entityText = textChars.slice(start, end).join('')
    result.push(createFinalEntity(range.data, entityText, result.length))
    cursor = end
  }

  // 尾部文本
  if (cursor < textChars.length) {
    result.push({
      type: 'text',
      text: textChars.slice(cursor).join(''),
      index: result.length,
    })
  }

  // 移除 Media 占位的 Text (如果需要) 并添加 Media Entity
  const mediaRange = ranges.find(range => range.type === 'media')
  if (mediaRange) {
    const mediaUrl = mediaRange.data.url?.trim()
    const idxToRemove = result.findIndex(e => e.type === 'text' && e.text.trim() === mediaUrl)
    if (idxToRemove !== -1)
      result.splice(idxToRemove, 1)

    result.forEach((entity) => {
      if (entity.type === 'text' && entity.text.includes(mediaUrl)) {
        entity.text = entity.text.replace(mediaUrl, '')
      }
    })

    // Media 始终追加在最后，或者根据业务需求放置
    // 这里我们不加入 Media 到 text 流中，通常由 UI 独立渲染组件
    // 但为了保持数据完整性，如果原逻辑需要返回 Media Entity，可以 push
    // result.push(createFinalEntity(mediaRange.data, '', result.length))
  }

  // 重新标准化 index 确保连续
  const standardEntities = result.map((e, i) => ({ ...e, index: i }))

  const legacy = tweet.legacy
  const extendedEntities = legacy?.extended_entities || legacy?.entities
  const mediaList = extendedEntities?.media || []

  const altEntities: Entity[] = []
  mediaList.forEach((media: any, i: number) => {
    if (media.ext_alt_text) {
      altEntities.push({
        type: 'separator',
        text: ' | ',
        index: 30000 + i,
        mediaIndex: i,
      } as Entity)
      altEntities.push({
        type: 'media_alt',
        text: media.ext_alt_text,
        media_url: media.media_url_https,
        index: 20000 + i,
      } as Entity)
    }
  })

  return [...standardEntities, ...altEntities]
}

export function getMediaAltEntities(tweet: RawTweet): Entity[] {
  const legacy = tweet.legacy
  const extendedEntities = legacy?.extended_entities || legacy?.entities
  const mediaList = extendedEntities?.media || []

  const altEntities: Entity[] = []
  mediaList.forEach((media: any, i: number) => {
    if (media.ext_alt_text) {
      // 这里的 Separator 主要是为了让 AI 理解上下文分隔
      // 实际翻译逻辑中可能会被过滤或特殊处理
      // altEntities.push({
      //   type: 'separator',
      //   text: ' | ',
      //   index: 30000 + i,
      //   mediaIndex: i,
      // } as Entity)
      altEntities.push({
        type: 'media_alt',
        text: media.ext_alt_text,
        media_url: media.media_url_https,
        index: 20000 + i,
      } as Entity)
    }
  })
  return altEntities
}

/**
 * 序列化：将 Entity 数组转换为带占位符的字符串
 */
export function serializeForAI(entities: Entity[]): TranslationPayload {
  const entityMap = new Map<string, Entity>()
  let maskedText = ''
  let pCounter = 0

  for (const entity of entities) {
    if (entity.type === 'text' || entity.type === 'media_alt') {
      maskedText += entity.text
    }
    else {
      // 生成占位符: <<__TYPE_INDEX__>>
      const placeholder = `<<__${entity.type.toUpperCase()}_${pCounter++}__>>`
      maskedText += placeholder
      entityMap.set(placeholder, entity)
    }
  }

  return { maskedText, entityMap }
}

/**
 * 还原：将翻译结果解析为 Entity 数组
 */
export function restoreEntities(
  translatedText: string,
  entityMap: Map<string, Entity>,
  originalEntities: Entity[], // 新增参数：原始实体数组
): Entity[] {
  const result: Entity[] = []
  // 创建原始实体的索引映射，便于快速查找
  const originalEntityByIndex = new Map<number, Entity>()
  const originalMediaAltByIndex = new Map<number, Entity>()

  // 构建索引映射
  for (const entity of originalEntities) {
    if (entity.type === 'text') {
      originalEntityByIndex.set(entity.index, entity)
    }
    else if (entity.type === 'media_alt') {
      originalMediaAltByIndex.set(entity.index, entity)
    }
  }

  // 正则捕获占位符，保留分隔符
  const parts = translatedText.split(/(<<__[A-Z]+_\d+__>>)/g)
  let newIndex = 0
  let lastSeparator: SeparatorEntity | null = null

  for (const part of parts) {
    if (!part)
      continue

    if (entityMap.has(part)) {
      // === 命中原有实体 (Hashtag, URL, Mention) ===
      // 直接复用原始对象，保留原始 text (如 #原本的Tag) 和 href
      const original = entityMap.get(part)!

      if (original.type === 'separator') {
        if ('mediaIndex' in original) {
          lastSeparator = original as SeparatorEntity
        }
        continue
      }

      result.push({
        ...original,
        index: newIndex++, // 更新排序索引
      })
    }
    else {
      if (lastSeparator) {
        // 处理 media_alt 类型
        const mediaIndex = 20000 + (lastSeparator.mediaIndex ?? 0)
        const originalMediaAlt = originalMediaAltByIndex.get(mediaIndex)

        result.push({
          type: 'media_alt',
          text: originalMediaAlt?.text ?? '', // 从原始实体中获取 text
          translation: part,
          index: mediaIndex,
        })
        lastSeparator = null
      }
      else {
        // 处理 text 类型
        const originalText = originalEntityByIndex.get(newIndex)

        result.push({
          type: 'text',
          text: originalText?.text ?? '', // 从原始实体中获取 text
          index: newIndex++,
          translation: part,
        })
      }
    }
  }

  return result
}
