import type { EnrichedTweet } from '~/types'

type AnyRecord = Record<string, any>

/**
 * 把旧缓存（`id_str` / `quoted_tweet_id` / `retweetedOrignalId` / `isInlineMeida`）
 * 归一化为 `@chilfish/tweet` 的字段命名。
 *
 * 只处理 enriched 契约字段，不碰 `card` / `entities` / `legacy` 里的 raw `id_str`。
 * 读缓存（localCache / DB）时调用；写入时自然落新字段。
 */
function normalizeNode(value: any): any {
  if (Array.isArray(value))
    return value.map(normalizeNode)
  if (!value || typeof value !== 'object')
    return value

  const next: AnyRecord = { ...value }

  if (typeof next.id_str === 'string' && next.id === undefined) {
    next.id = next.id_str
    delete next.id_str
  }
  if (next.quoted_tweet_id && next.quotedTweetId === undefined) {
    next.quotedTweetId = next.quoted_tweet_id
    delete next.quoted_tweet_id
  }
  if (next.retweetedOrignalId && next.retweetedOriginalId === undefined) {
    next.retweetedOriginalId = next.retweetedOrignalId
    delete next.retweetedOrignalId
  }
  if (typeof next.isInlineMeida === 'boolean' && next.isInlineMedia === undefined) {
    next.isInlineMedia = next.isInlineMeida
    delete next.isInlineMeida
  }

  if (next.user)
    next.user = normalizeNode(next.user)
  if (next.space)
    next.space = normalizeNode(next.space)
  if (next.quotedTweet)
    next.quotedTweet = normalizeNode(next.quotedTweet)
  if (Array.isArray(next.comments))
    next.comments = next.comments.map(normalizeNode)

  return next
}

export function normalizeEnrichedTweet(tweet: EnrichedTweet): EnrichedTweet {
  return normalizeNode(tweet) as EnrichedTweet
}
