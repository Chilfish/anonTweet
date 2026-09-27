/**
 * X Article（长文）数据。
 *
 * 文章型推文（`x.com/<user>/article/<id>`）的正文不在 `legacy.full_text` 里，
 * 只有一条指向文章页的 t.co 链接；正文从推文响应的 `article` 节点取回：
 * - `withArticleRichContentState` → Draft.js `content_state`（块文档，首选）
 * - `withArticlePlainText` → `plain_text`（纯文本兜底）
 */
export interface TweetArticle {
  /** 文章 rest_id（`x.com/i/article/<id>` 里的 id） */
  id: string
  /** 文章永久链接 */
  url: string
  title: string
  /** 摘要（无富文本时也能拿到） */
  previewText?: string
  /** 纯文本全文（`content_state` 缺失时的兜底正文） */
  plainText?: string
  /** 结构化判别：`rich` 表示 `blocks` 可用；`plain` 只有纯文本。供缓存回填升级 */
  format: 'rich' | 'plain'
  /** 封面图 */
  coverImage?: ArticleMedia
  /** 首次发布时间（毫秒） */
  publishedAt?: number
  /** 块文档（`format === 'rich'` 时存在） */
  blocks?: ArticleBlock[]
}

/** 文章内嵌媒体（图片） */
export interface ArticleMedia {
  id: string
  url: string
  width?: number
  height?: number
  alt?: string
}

export type ArticleInlineStyle = 'bold' | 'italic' | 'strikethrough'

/** 块内行内片段 */
export type ArticleRun = {
  text: string
  /** 行内样式 */
  styles?: ArticleInlineStyle[]
} & (
  | { type: 'text' }
  | { type: 'link', url: string }
  | { type: 'mention' | 'hashtag', href: string }
)

/** 文章块（Draft.js block → 语义化块） */
export type ArticleBlock
  = | { key: string, type: 'paragraph', runs: ArticleRun[] }
    | { key: string, type: 'heading', level: 1 | 2 | 3, runs: ArticleRun[] }
    | { key: string, type: 'list-item', ordered: boolean, runs: ArticleRun[] }
    | { key: string, type: 'quote', runs: ArticleRun[] }
  /** `MARKDOWN` 实体：作者写入的 GFM（表格 / 代码块 / 列表等），由 markdown 渲染器呈现 */
    | { key: string, type: 'markdown', text: string }
    | { key: string, type: 'divider' }
    | { key: string, type: 'image', media: ArticleMedia, caption?: string }
    | { key: string, type: 'embed-tweet', tweetId: string }
    | { key: string, type: 'link', url: string }
  /** 未知块类型：保留纯文本以免内容丢失 */
    | { key: string, type: 'unknown', text?: string }
