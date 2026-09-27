import type { ArticleBlock, ArticleRun, TweetArticle } from '~/types'
import { derivePlainText } from './parse'

/**
 * 文章块文档 → 纯文本 / Markdown（复制、分享用，无 DOM 依赖）。
 * 与推文的 `generateText` / `generateMarkdownFromTweets` 平行，仅覆盖文章形态。
 */

function runsToMarkdown(runs: ArticleRun[]): string {
  return runs
    .map((run) => {
      let out = run.type === 'link'
        ? `[${run.text}](${run.url})`
        : (run.type === 'text' ? run.text : `[${run.text}](${run.href})`)

      if (run.styles?.includes('bold'))
        out = `**${out}**`
      if (run.styles?.includes('italic'))
        out = `*${out}*`
      if (run.styles?.includes('strikethrough'))
        out = `~~${out}~~`
      return out
    })
    .join('')
}

function blockToMarkdown(block: Exclude<ArticleBlock, { type: 'list-item' }>): string | null {
  switch (block.type) {
    case 'paragraph':
      return runsToMarkdown(block.runs)
    // 标题降一级：文章标题已占用 `#`
    case 'heading':
      return `${'#'.repeat(block.level + 1)} ${runsToMarkdown(block.runs)}`
    case 'quote':
      return `> ${runsToMarkdown(block.runs)}`
    case 'markdown':
      return block.text
    case 'divider':
      return '---'
    case 'image':
      return `![${block.caption ?? 'Image'}](${block.media.url})${block.caption ? `\n\n*${block.caption}*` : ''}`
    case 'embed-tweet':
      return `https://x.com/i/status/${block.tweetId}`
    case 'link':
      return block.url
    case 'unknown':
      return block.text ?? null
  }
}

/** 块文档 → Markdown 正文（列表按相邻有序性归组，与渲染一致） */
export function articleBlocksToMarkdown(blocks: ArticleBlock[]): string {
  const parts: string[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!

    if (block.type === 'list-item') {
      const ordered = block.ordered
      const lines: string[] = []
      let index = 1
      let cursor = i
      while (cursor < blocks.length) {
        const current = blocks[cursor]!
        if (current.type !== 'list-item' || current.ordered !== ordered)
          break
        lines.push(`${ordered ? `${index++}.` : '-'} ${runsToMarkdown(current.runs)}`)
        cursor++
      }
      i = cursor - 1
      parts.push(lines.join('\n'))
      continue
    }

    const markdown = blockToMarkdown(block)
    if (markdown)
      parts.push(markdown)
  }

  return parts.join('\n\n')
}

/** 文章 → Markdown（标题 + 原文链接 + 正文） */
export function articleToMarkdown(article: TweetArticle): string {
  const header = [`# ${article.title || 'X 长文'}`, `[原文链接](${article.url})`]
  const body = article.blocks?.length
    ? articleBlocksToMarkdown(article.blocks)
    : (article.plainText ?? article.previewText ?? '')
  return body ? `${header.join('\n\n')}\n\n${body}` : header.join('\n\n')
}

/** 文章 → 纯文本（标题 + 正文 + 链接），用于分享 / 复制正文 */
export function articleToText(article: TweetArticle): string {
  const body = article.blocks?.length
    ? derivePlainText(article.blocks)
    : (article.plainText ?? article.previewText ?? '')
  return [article.title, body, article.url].filter(part => part?.trim()).join('\n\n')
}
