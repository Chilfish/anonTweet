import type { EnrichedTweet, Entity } from '~/types'
import { applyAITranslations } from '../react-tweet'
import { flatTweets } from '../utils'

/** 检查文本有效性 (纯函数) */
export function checkTextContent(text?: string): boolean {
  if (!text)
    return false
  const cleanText = text.trim()
  if (cleanText.length === 0)
    return false

  // 移除元数据后检查是否有剩余文本
  const contentWithoutMeta = cleanText
    .replace(/https?:\/\/\S+/g, '')
    .replace(/@\w+/g, '')
    .replace(/#\w+/g, '')
    .trim()

  return contentWithoutMeta.length > 0
}

/** 从 Entity 数组中提取翻译缓存 (纯函数) */
export function extractTranslationsFromEntities(tweets: EnrichedTweet | EnrichedTweet[]): Record<string, Entity[]> {
  const list = flatTweets(Array.isArray(tweets) ? tweets : [tweets])
  const extracted: Record<string, Entity[]> = {}

  for (const tweet of list) {
    if (!tweet.entities?.length)
      continue

    const hasTranslation = tweet.entities.some(
      entity => typeof entity.translation === 'string' && entity.translation?.trim(),
    )

    if (hasTranslation) {
      extracted[tweet.id_str] = tweet.entities
    }
  }

  return extracted
}

function stripEntityTranslation(entity: Entity): Entity {
  if (entity.translation == null)
    return entity
  const copy: Entity = { ...entity }
  // 只剥离人工翻译字段，AI 翻译字段可以保留在推文主体中作为“预制翻译”
  delete (copy as any).translation
  return copy
}

/**
 * 处理推文数据，进行兼容性合并并剥离人工翻译字段。
 */
export function processTweetsForStore(tweets: EnrichedTweet[]): EnrichedTweet[] {
  return tweets.map((tweet) => {
    let entities = tweet.entities || []

    // 兼容性处理：如果存在旧的 autoTranslationEntities 且 entities 还没合并过 AI 翻译
    if (tweet.autoTranslationEntities?.length && !entities.some(e => !!e.aiTranslation)) {
      entities = applyAITranslations(entities, tweet.autoTranslationEntities)
    }

    const cleaned: EnrichedTweet = {
      ...tweet,
      entities: entities.map(stripEntityTranslation),
      // 处理完后可以删除旧字段（可选，为了彻底重构）
      autoTranslationEntities: undefined,
    }

    if (tweet.quotedTweet) {
      let qEntities = tweet.quotedTweet.entities || []
      if (tweet.quotedTweet.autoTranslationEntities?.length && !qEntities.some(e => !!e.aiTranslation)) {
        qEntities = applyAITranslations(qEntities, tweet.quotedTweet.autoTranslationEntities)
      }
      cleaned.quotedTweet = {
        ...tweet.quotedTweet,
        entities: qEntities.map(stripEntityTranslation),
        autoTranslationEntities: undefined,
      }
    }

    return cleaned
  })
}

/**
 * Legacy alias
 */
export function stripTranslationsFromTweets(tweets: EnrichedTweet[]): EnrichedTweet[] {
  return processTweetsForStore(tweets)
}

/** 递归查找所有后代 Tweet ID (纯函数) */
export function findDescendantIds(allTweets: EnrichedTweet[], parentId: string): string[] {
  const children = allTweets.filter(t => t.in_reply_to_status_id_str === parentId)
  let ids = children.map(t => t.id_str)

  children.forEach((child) => {
    ids = [...ids, ...findDescendantIds(allTweets, child.id_str)]
  })

  return ids
}
