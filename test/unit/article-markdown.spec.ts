import type { TweetArticle } from '~/types'
import { describe, expect, it } from 'vitest'
import { articleBlocksToMarkdown, articleToMarkdown, articleToText } from '~/lib/article/markdown'

const article: TweetArticle = {
  id: '2103576349499855160',
  url: 'https://x.com/i/article/2103576349499855160',
  title: '长文标题',
  previewText: '摘要',
  format: 'rich',
  blocks: [
    { key: 'h', type: 'heading', level: 1, runs: [{ type: 'text', text: '小标题' }] },
    {
      key: 'p',
      type: 'paragraph',
      runs: [
        { type: 'text', text: '见 ' },
        { type: 'link', text: '链接', url: 'https://example.com' },
        { type: 'text', text: ' 与 ' },
        { type: 'mention', text: '@foo', href: 'https://x.com/foo' },
      ],
    },
    { key: 'l1', type: 'list-item', ordered: false, runs: [{ type: 'text', text: '项目一' }] },
    { key: 'l2', type: 'list-item', ordered: false, runs: [{ type: 'text', text: '项目二' }] },
    { key: 'md', type: 'markdown', text: '| a | b |\n| - | - |\n| 1 | 2 |' },
    { key: 'd', type: 'divider' },
    { key: 'i', type: 'image', media: { id: 'm', url: 'https://pbs.twimg.com/media/x.jpg' }, caption: '图注' },
    { key: 'e', type: 'embed-tweet', tweetId: '2104058634452005231' },
  ],
}

describe('article export helpers', () => {
  it('renders runs, headings, lists, markdown and images as markdown', () => {
    const markdown = articleBlocksToMarkdown(article.blocks!)

    expect(markdown).toContain('## 小标题')
    expect(markdown).toContain('[链接](https://example.com)')
    expect(markdown).toContain('[@foo](https://x.com/foo)')
    expect(markdown).toContain('- 项目一\n- 项目二')
    expect(markdown).toContain('| a | b |')
    expect(markdown).toContain('---')
    expect(markdown).toContain('![图注](https://pbs.twimg.com/media/x.jpg)')
    expect(markdown).toContain('https://x.com/i/status/2104058634452005231')
  })

  it('prefixes the title and source link', () => {
    const markdown = articleToMarkdown(article)

    expect(markdown.startsWith('# 长文标题')).toBe(true)
    expect(markdown).toContain('[原文链接](https://x.com/i/article/2103576349499855160)')
  })

  it('derives plain text for copy/share', () => {
    const text = articleToText(article)

    expect(text).toContain('长文标题')
    // 纯文本按显示文案拼接（链接保留可见文字，不展开 href）
    expect(text).toContain('见 链接 与 @foo')
    expect(text).toContain('https://x.com/i/article/2103576349499855160')
  })

  it('falls back to plainText when there are no blocks', () => {
    const plain: TweetArticle = {
      id: '1',
      url: 'https://x.com/i/article/1',
      title: 'T',
      plainText: '仅有纯文本',
      format: 'plain',
    }

    expect(articleToText(plain)).toContain('仅有纯文本')
    expect(articleToMarkdown(plain)).toContain('仅有纯文本')
  })
})
