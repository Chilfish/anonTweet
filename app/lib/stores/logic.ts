import type { EnrichedTweet, Entity } from '~/types'
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

/** 递归查找所有后代 Tweet ID (纯函数) */
export function findDescendantIds(allTweets: EnrichedTweet[], parentId: string): string[] {
  const children = allTweets.filter(t => t.in_reply_to_status_id_str === parentId)
  let ids = children.map(t => t.id_str)

  children.forEach((child) => {
    ids = [...ids, ...findDescendantIds(allTweets, child.id_str)]
  })

  return ids
}
