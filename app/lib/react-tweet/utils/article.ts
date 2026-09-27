import type { RawArticleResult } from '~/lib/rettiwt-api/types/raw/tweet/Details'
import type { Entity, RawTweet, TweetArticle } from '~/types'
import { mediaFromRaw, parseContentState } from '~/lib/article/parse'

/**
 * X Article（长文）纯映射逻辑。
 *
 * 文章型推文的正文不在 `legacy.full_text`/`note_tweet` 里，而是一条指向文章页
 * 的 t.co 链接；文章本体在推文的 `article` 节点：
 *
 * ```json
 * { "article": { "article_results": { "result": {
 *   "rest_id": "2104009234858024962", "title": "…", "preview_text": "…",
 *   "plain_text": "…（需 withArticlePlainText）",
 *   "content_state": { "blocks": [...], "entityMap": [...] },   // 需 withArticleRichContentState
 *   "media_entities": [...], "cover_media": {...}, "metadata": { "first_published_at_secs": … }
 * } } } }
 * ```
 *
 * 与 `space.ts` 一样只做纯映射，不做 IO，便于单测。块解析见 `~/lib/article/parse`。
 */

/** 正文/实体里的文章链接：`x.com/i/article/<id>` 或 `x.com/<user>/article/<id>` */
const ARTICLE_URL_RE = /^https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/\w+\/article\/(\d+)/

/** 该 URL 是否指向 X 文章页（正文据此避免与卡片重复展示同一个跳转） */
export function isArticleUrl(url?: string | null): boolean {
  return typeof url === 'string' && ARTICLE_URL_RE.test(url)
}

/** 从文章链接里取出文章 id；不是文章链接时返回 null */
export function extractArticleIdFromUrl(url?: string | null): string | null {
  if (typeof url !== 'string')
    return null
  return ARTICLE_URL_RE.exec(url)?.[1] ?? null
}

/**
 * 从推文实体里取文章 id（上游 `article` 节点缺失时的回退，兼容旧缓存探测）。
 */
export function resolveArticleId(entities?: ReadonlyArray<unknown> | null): string | null {
  for (const entity of entities ?? []) {
    const id = extractArticleIdFromUrl((entity as { href?: string } | null | undefined)?.href)
    if (id)
      return id
  }
  return null
}

function toArticleUrl(id: string): string {
  return `https://x.com/i/article/${id}`
}

function articleFromRawResult(result: RawArticleResult, id: string): TweetArticle | null {
  const title = typeof result.title === 'string' ? result.title.trim() : ''
  const previewText = typeof result.preview_text === 'string' && result.preview_text.trim()
    ? result.preview_text
    : undefined
  const blocks = parseContentState(result.content_state, result.media_entities)
  // 有块文档时 blocks 已覆盖全文，`plain_text` 完全冗余（长文可达数十 KB）——
  // 仅在没有块文档（plain 降级）时保留纯文本。
  const plainText = blocks.length === 0 && typeof result.plain_text === 'string' && result.plain_text.trim()
    ? result.plain_text
    : undefined

  if (!title && !previewText && !plainText && blocks.length === 0)
    return null

  const publishedSecs = result.metadata?.first_published_at_secs

  return {
    id,
    url: toArticleUrl(id),
    title,
    previewText,
    plainText,
    format: blocks.length > 0 ? 'rich' : 'plain',
    coverImage: mediaFromRaw(result.cover_media) ?? undefined,
    publishedAt: typeof publishedSecs === 'number' && publishedSecs > 0 ? publishedSecs * 1000 : undefined,
    blocks: blocks.length > 0 ? blocks : undefined,
  }
}

/**
 * 从推文 `article` 节点映射出 {@link TweetArticle}。
 *
 * 无标题/摘要/正文时返回 null —— 宁可让正文里的裸链接照常渲染，也不给一张空卡片
 * （与 `mapTwitterCard` 的最终校验同一取舍）。仅有文章链接（search/list 等不取富文本
 * 的路径）时，卡片入口由 {@link resolveArticleLink} 提供。
 */
export function mapArticle(rawTweet: RawTweet | null | undefined, entities?: Entity[]): TweetArticle | null {
  const result = (rawTweet as { article?: { article_results?: { result?: RawArticleResult } } } | null | undefined)
    ?.article
    ?.article_results
    ?.result

  const id = typeof result?.rest_id === 'string' && result.rest_id
    ? result.rest_id
    : resolveArticleId(entities)

  if (!id || !result)
    return null

  return articleFromRawResult(result, id)
}

/**
 * 只凭正文里的文章链接给出一个最小入口（`title` 为空）。
 *
 * 供 search / list / user-timeline 等**不取富文本**的路径渲染「X Article → 阅读全文」，
 * 点击进入 `/article/:id` 后再拉取完整块文档。
 */
export function resolveArticleLink(entities?: ReadonlyArray<unknown> | null): TweetArticle | null {
  const id = resolveArticleId(entities)
  if (!id)
    return null
  return { id, url: toArticleUrl(id), title: '', format: 'plain' }
}
