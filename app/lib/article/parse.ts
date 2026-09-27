import type {
  RawArticleBlock,
  RawArticleContentState,
  RawArticleEntityValue,
  RawArticleMedia,
} from '~/lib/rettiwt-api/types/raw/tweet/Details'
import type { ArticleBlock, ArticleInlineStyle, ArticleMedia, ArticleRun } from '~/types'

/**
 * X Article 的 Draft.js `content_state` → 语义化块文档（纯函数，无 IO）。
 *
 * 上游实测形态（样例见 `test/fixtures/articles/*.json`）：
 * - `blocks[]`：`{ key, text, type, data, entityRanges[], inlineStyleRanges[] }`
 * - `entityMap`：`[{ key, value: { type, data } }]`；`type ∈ LINK | MARKDOWN | MEDIA | DIVIDER | TWEET`
 * - 块内 @mention / #hashtag 走 `block.data.mentions/hashtags` 的 `fromIndex/toIndex` span
 * - 图片：atomic 块 → `MEDIA` 实体 `data.mediaItems[].mediaId` → `media_entities[]`（按 media_id 索引）
 */

interface SpecialSpan {
  start: number
  end: number
  run: ArticleRun
}

const LEADING_AT_RE = /^@/
const LEADING_HASH_RE = /^#/

const MENTION_HREF = (text: string) => `https://x.com/${text.replace(LEADING_AT_RE, '')}`
const HASHTAG_HREF = (text: string) => `https://x.com/hashtag/${text.replace(LEADING_HASH_RE, '')}`

function toStyle(style?: string): ArticleInlineStyle | null {
  switch (style?.toLowerCase()) {
    case 'bold':
      return 'bold'
    case 'italic':
      return 'italic'
    case 'strikethrough':
      return 'strikethrough'
    default:
      return null
  }
}

/** 兼容 `[{key,value}]` 与 `Record<key,value>` 两种 entityMap 形态 */
export function normalizeEntityMap(
  entityMap?: RawArticleContentState['entityMap'],
): Map<string, RawArticleEntityValue> {
  const map = new Map<string, RawArticleEntityValue>()
  if (!entityMap)
    return map

  if (Array.isArray(entityMap)) {
    for (const entity of entityMap) {
      if (entity?.key !== undefined && entity.value)
        map.set(String(entity.key), entity.value)
    }
  }
  else if (typeof entityMap === 'object') {
    for (const [key, value] of Object.entries(entityMap)) {
      if (value)
        map.set(String(key), value)
    }
  }
  return map
}

/** 原始媒体节点 → {@link ArticleMedia}；缺 id/url 时返回 null */
export function mediaFromRaw(raw?: RawArticleMedia | null): ArticleMedia | null {
  const url = raw?.media_info?.original_img_url
  const id = raw?.media_id ?? raw?.id
  if (!url || !id)
    return null

  return {
    id,
    url,
    width: raw?.media_info?.original_img_width,
    height: raw?.media_info?.original_img_height,
  }
}

function mediaIdFromEntity(value: RawArticleEntityValue): string | undefined {
  const items = (value.data?.mediaItems ?? value.data?.media_items ?? []) as Array<Record<string, unknown>>
  const first = items[0]
  return (first?.mediaId as string | undefined) ?? (first?.media_id as string | undefined)
}

/** 依据行内样式区间，取出恰好覆盖 [start, end) 的样式集合 */
function stylesInRange(
  styleRanges: Array<{ start: number, end: number, style: ArticleInlineStyle }>,
  start: number,
  end: number,
): ArticleInlineStyle[] | undefined {
  const styles: ArticleInlineStyle[] = []
  for (const range of styleRanges) {
    if (range.start <= start && range.end >= end && !styles.includes(range.style))
      styles.push(range.style)
  }
  return styles.length > 0 ? styles : undefined
}

/**
 * 块文本 → 行内 run[]（LINK 实体 + mention/hashtag span + 行内样式）。
 *
 * 行内样式区间（Bold/Italic）与实体 span **一样是切分点**：Draft.js 里一段文本的
 * run 由「实体边界 ∩ 样式边界」共同决定。若只按实体切分，一个只覆盖前半段的 Bold
 * 区间会被整段应用（实测：`{offset:0,length:15,style:Bold}` 的段落整段渲染成粗体）。
 */
function buildRuns(block: RawArticleBlock, entityMap: Map<string, RawArticleEntityValue>): ArticleRun[] {
  const text = block.text ?? ''
  if (!text)
    return []

  const spans: SpecialSpan[] = []

  for (const range of block.entityRanges ?? []) {
    const value = entityMap.get(String(range.key))
    if (value?.type !== 'LINK' || !value.data?.url)
      continue
    const start = Math.max(0, range.offset)
    const end = Math.min(text.length, range.offset + range.length)
    if (end <= start)
      continue
    spans.push({ start, end, run: { type: 'link', text: text.slice(start, end), url: value.data.url } })
  }

  for (const mention of block.data?.mentions ?? []) {
    if (mention.fromIndex === undefined || mention.toIndex === undefined)
      continue
    const start = Math.max(0, mention.fromIndex)
    const end = Math.min(text.length, mention.toIndex)
    if (end <= start)
      continue
    const spanText = text.slice(start, end)
    spans.push({ start, end, run: { type: 'mention', text: spanText, href: MENTION_HREF(spanText) } })
  }

  for (const hashtag of block.data?.hashtags ?? []) {
    if (hashtag.fromIndex === undefined || hashtag.toIndex === undefined)
      continue
    const start = Math.max(0, hashtag.fromIndex)
    const end = Math.min(text.length, hashtag.toIndex)
    if (end <= start)
      continue
    const spanText = text.slice(start, end)
    spans.push({ start, end, run: { type: 'hashtag', text: spanText, href: HASHTAG_HREF(spanText) } })
  }

  const styleRanges = (block.inlineStyleRanges ?? [])
    .map(range => ({
      start: Math.max(0, range.offset),
      end: Math.min(text.length, range.offset + range.length),
      style: toStyle(range.style),
    }))
    .filter((range): range is { start: number, end: number, style: ArticleInlineStyle } =>
      Boolean(range.style) && range.end > range.start)

  // 切分点 = 实体边界 ∪ 样式边界（含首尾）
  const points = new Set<number>([0, text.length])
  for (const span of spans) {
    points.add(span.start)
    points.add(span.end)
  }
  for (const range of styleRanges) {
    points.add(range.start)
    points.add(range.end)
  }
  const bounds = [...points].sort((a, b) => a - b)

  const runs: ArticleRun[] = []
  for (let i = 0; i < bounds.length - 1; i++) {
    const start = bounds[i]!
    const end = bounds[i + 1]!
    if (end <= start)
      continue

    const styles = stylesInRange(styleRanges, start, end)
    const span = spans.find(s => s.start <= start && s.end >= end)
    const segment = text.slice(start, end)

    runs.push(span
      ? { ...span.run, text: segment, styles }
      : { type: 'text', text: segment, styles })
  }

  return runs
}

function parseAtomicBlock(
  key: string,
  block: RawArticleBlock,
  entityMap: Map<string, RawArticleEntityValue>,
  mediaIndex: Map<string, ArticleMedia>,
): ArticleBlock {
  const range = block.entityRanges?.[0]
  const value = range ? entityMap.get(String(range.key)) : undefined

  switch (value?.type) {
    case 'MEDIA': {
      const mediaId = mediaIdFromEntity(value)
      const media = mediaId ? mediaIndex.get(mediaId) : undefined
      if (media)
        return { key, type: 'image', media, caption: value.data?.caption }
      return { key, type: 'unknown', text: block.text?.trim() || undefined }
    }
    case 'MARKDOWN':
      return { key, type: 'markdown', text: value.data?.markdown ?? '' }
    case 'DIVIDER':
      return { key, type: 'divider' }
    case 'TWEET':
      return { key, type: 'embed-tweet', tweetId: String(value.data?.tweetId ?? '') }
    case 'LINK':
      return { key, type: 'link', url: value.data?.url ?? '' }
    default:
      return { key, type: 'unknown', text: block.text?.trim() || undefined }
  }
}

function parseBlock(
  block: RawArticleBlock,
  index: number,
  entityMap: Map<string, RawArticleEntityValue>,
  mediaIndex: Map<string, ArticleMedia>,
): ArticleBlock | null {
  const key = block.key || `block-${index}`

  if (block.type === 'atomic')
    return parseAtomicBlock(key, block, entityMap, mediaIndex)

  const runs = buildRuns(block, entityMap)
  // 空块（无文本、无 run）不产出，避免渲染出空段落
  if (runs.length === 0 || runs.every(run => !run.text.trim()))
    return null

  switch (block.type) {
    case 'header-one':
      return { key, type: 'heading', level: 1, runs }
    case 'header-two':
      return { key, type: 'heading', level: 2, runs }
    case 'header-three':
      return { key, type: 'heading', level: 3, runs }
    case 'unordered-list-item':
      return { key, type: 'list-item', ordered: false, runs }
    case 'ordered-list-item':
      return { key, type: 'list-item', ordered: true, runs }
    case 'blockquote':
      return { key, type: 'quote', runs }
    // unstyled 及未知块类型统一按段落渲染，保证不丢内容
    default:
      return { key, type: 'paragraph', runs }
  }
}

/**
 * `content_state` → 块文档。无有效块时返回空数组（调用方据此回退 `plain_text`）。
 */
export function parseContentState(
  contentState?: RawArticleContentState | null,
  mediaEntities?: RawArticleMedia[] | null,
): ArticleBlock[] {
  const blocks = contentState?.blocks
  if (!Array.isArray(blocks) || blocks.length === 0)
    return []

  const entityMap = normalizeEntityMap(contentState?.entityMap)

  const mediaIndex = new Map<string, ArticleMedia>()
  for (const raw of mediaEntities ?? []) {
    const media = mediaFromRaw(raw)
    if (media)
      mediaIndex.set(media.id, media)
  }

  return blocks
    .map((block, index) => parseBlock(block, index, entityMap, mediaIndex))
    .filter((block): block is ArticleBlock => block !== null)
}

/** 文章块里的内嵌推文 id（去重、保序）——阅读页据此并行取回真实推文 */
export function collectEmbeddedTweetIds(blocks: ArticleBlock[]): string[] {
  const ids: string[] = []
  for (const block of blocks) {
    if (block.type === 'embed-tweet' && block.tweetId && !ids.includes(block.tweetId))
      ids.push(block.tweetId)
  }
  return ids
}

/** 块文档 → 纯文本（`plain_text` 缺失时的兜底正文） */
export function derivePlainText(blocks: ArticleBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'markdown':
          return block.text
        case 'image':
          return block.caption ?? ''
        case 'embed-tweet':
          return `https://x.com/i/status/${block.tweetId}`
        case 'link':
          return block.url
        case 'divider':
          return ''
        case 'unknown':
          return block.text ?? ''
        default:
          return block.runs.map(run => run.text).join('')
      }
    })
    .filter(text => text.trim().length > 0)
    .join('\n\n')
}
