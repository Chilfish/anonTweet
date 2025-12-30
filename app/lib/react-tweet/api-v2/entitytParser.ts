import type {
  Entity,
  EntityWithType,
  Indices,
  RawTweet,
} from './types'

interface EntityRange {
  type: EntityWithType['type']
  indices: Indices
  data: EntityWithType // 原始数据
}

function extractRanges(tweet: RawTweet, leadingMentionEndIndex: number): EntityRange[] {
  const ranges: EntityRange[] = []
  const entitySet = new Set<string>() // 用于去重

  // 统一处理逻辑：添加一个实体范围
  const addRange = (source: any, type: EntityWithType['type'], isNote: boolean) => {
    if (!source)
      return

    // 原始索引
    const rawIndices = source.indices as [number, number]

    // 计算调整后的索引（移除句首 mention）
    // 注意：如果实体在被移除的范围内，则丢弃或截断
    if (rawIndices[1] <= leadingMentionEndIndex)
      return

    // Media 特殊处理：Twitter API 有时把 Media 算在 text range 外，有时在内
    // 我们约定 Media 不占用 Text 的字符空间（或者在最后），但在渲染列表中占位
    const effectiveIndices: Indices = type === 'media'
      ? [0, 0] // Media 不参与文本切割，它通常独立存在
      : [
          Math.max(0, rawIndices[0] - leadingMentionEndIndex),
          Math.max(0, rawIndices[1] - leadingMentionEndIndex),
        ]

    // 生成唯一键去重
    const key = `${effectiveIndices[0]}-${effectiveIndices[1]}-${type}`
    if (entitySet.has(key))
      return
    entitySet.add(key)

    ranges.push({
      type,
      indices: effectiveIndices,
      data: { ...source, type, indices: effectiveIndices } as EntityWithType,
    })
  }

  // 数据源优先级：Note Tweet > Legacy
  const legacy = tweet.legacy.entities
  const note = tweet.note_tweet?.note_tweet_results?.result.entity_set

  // 辅助遍历函数
  const processSource = (source: any, isNote: boolean) => {
    if (!source)
      return
    source.hashtags?.forEach((e: any) => addRange(e, 'hashtag', isNote))
    source.user_mentions?.forEach((e: any) => addRange(e, 'mention', isNote))
    source.urls?.forEach((e: any) => addRange(e, 'url', isNote))
    source.symbols?.forEach((e: any) => addRange(e, 'symbol', isNote))
    source.media?.forEach((e: any) => addRange(e, 'media', isNote))
  }

  // 策略：如果使用了 Note Text，主要信赖 Note Entities；否则信赖 Legacy
  // 但为了稳健，通常 Note 存在时优先取 Note
  if (note)
    processSource(note, true)
  else processSource(legacy, false)

  // 排序：按起始位置排序，Media 放最后
  return ranges.sort((a, b) => {
    if (a.type === 'media')
      return 1
    if (b.type === 'media')
      return -1
    return a.indices[0] - b.indices[0]
  })
}

export function getEntities(tweet: RawTweet, rawText: string): Entity[] {
  // 1. 预处理文本：计算需要移除的句首 Mention 长度
  const leadingMentionMatch = rawText.match(/^(@\w{1,15}\s*)+/)
  const leadingMentionEndIndex = leadingMentionMatch ? leadingMentionMatch[0].length : 0

  // 2. 真正的显示文本（移除句首 Garbage）
  const displayText = rawText.slice(leadingMentionEndIndex)

  // 3. 获取标准化、坐标已修正的实体范围
  const ranges = extractRanges(tweet, leadingMentionEndIndex)

  const result: Entity[] = []
  let cursor = 0
  const textChars = Array.from(displayText) // 使用 Array.from 避免 Emoji 截断问题

  // 4. 遍历实体，填充中间的 Text 片段
  // 过滤掉 Media，因为 Media 不切分文本，只追加在最后
  const textRanges = ranges.filter(r => r.type !== 'media')

  for (const range of textRanges) {
    const [start, end] = range.indices

    // A. 填充当前光标到实体开始处的纯文本
    if (cursor < start) {
      const textSegment = textChars.slice(cursor, start).join('')
      if (textSegment) {
        result.push({
          type: 'text',
          text: textSegment,
          indices: [cursor, start],
          index: result.length,
        })
      }
    }

    // B. 添加实体本身
    // 需要根据类型补充 href 等计算属性
    const entityText = textChars.slice(start, end).join('')
    const processedEntity = createFinalEntity(range.data, entityText, result.length)
    result.push(processedEntity)

    cursor = end
  }

  // C. 处理剩余尾部文本
  if (cursor < textChars.length) {
    result.push({
      type: 'text',
      text: textChars.slice(cursor).join('') || '',
      indices: [cursor, textChars.length],
      index: result.length,
    })
  }

  // D. 追加 Media 实体 (不占用文本流)
  ranges.filter(r => r.type === 'media').forEach((range) => {
    result.push(createFinalEntity(range.data, '', result.length))
  })

  return result
}

// 辅助：生成最终 Entity 对象（添加 href 等）
function createFinalEntity(base: EntityWithType, text: string, index: number): Entity {
  const common = { index, text }

  switch (base.type) {
    case 'hashtag':
      return { ...base, ...common, href: `https://twitter.com/hashtag/${base.text}` }
    case 'mention':
      return { ...base, ...common, href: `https://twitter.com/${base.screen_name}` }
    case 'url':
    case 'media':
      return { ...base, ...common, href: base.expanded_url, text: base.display_url || text } // URL显示文本通常是 display_url
    case 'symbol':
      return { ...base, ...common, href: `https://twitter.com/search?q=%24${base.text}` }
    default:
      return { ...base, ...common } as any
  }
}

interface TranslationContext {
  maskedText: string
  entityMap: Map<string, string>
}

/**
 * 预处理：将推文中的实体替换为占位符
 */
export function serializeForAI(rawText: string): TranslationContext {
  const entityMap = new Map<string, string>()
  let counter = 0

  // 定义替换逻辑
  // 注意：实际生产中建议使用 twitter-text 库进行精准匹配，此处使用通用正则演示
  const replaceAndMap = (text: string, regex: RegExp, typePrefix: string) => {
    return text.replace(regex, (match) => {
      // 生成特殊的占位符，格式如: <<__MENTION_0__>>
      // 使用双尖括号和下划线是为了最大限度防止与Markdown或普通文本冲突
      const placeholder = `<<__${typePrefix}_${counter++}__>>`
      entityMap.set(placeholder, match)
      return placeholder
    })
  }

  let processedText = rawText

  // 1. 替换 URL (通常 URL 最长，优先替换以免被截断)
  // 简单的 URL 匹配正则
  processedText = replaceAndMap(processedText, /https?:\/\/\S+/g, 'URL')

  // 2. 替换 Mentions (@user)
  processedText = replaceAndMap(processedText, /@\w+/g, 'MENTION')

  // 3. 替换 Hashtags (#tag)
  // 支持中文及多语言标签
  processedText = replaceAndMap(processedText, /#[^\s!@#$%^&*(),.?":{}|<>]+/g, 'TAG')

  // 4. 替换 Cashtags ($BTC)
  processedText = replaceAndMap(processedText, /\$[a-z]{1,6}/gi, 'CASH')

  return {
    maskedText: processedText,
    entityMap,
  }
}

/**
 * 后处理：将翻译后的文本中的占位符还原为原始实体
 */
export function restoreEntities(translatedText: string, entityMap: Map<string, string>): string {
  let finalText = translatedText

  // 遍历 Map 进行还原
  entityMap.forEach((originalValue, placeholder) => {
    // 全局替换，防止 AI 在长文中多次引用同一个占位符（虽然罕见）
    // 需要对 placeholder 进行转义以用于正则
    const escapedPlaceholder = placeholder.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
    const regex = new RegExp(escapedPlaceholder, 'g')
    finalText = finalText.replace(regex, originalValue)
  })

  return finalText
}
