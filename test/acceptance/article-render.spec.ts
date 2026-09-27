import type { RawArticleContentState, RawArticleMedia } from '~/lib/rettiwt-api/types/raw/tweet/Details'
import type { ArticleBlock } from '~/types'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ArticleBody } from '~/components/article'
import { parseContentState } from '~/lib/article/parse'
import mvernalFixture from '../fixtures/articles/2099885132379500562.json'
import trq212Fixture from '../fixtures/articles/2103576349499855160.json'

/**
 * test/acceptance/article-render.spec.ts
 *
 * AC-TWEET-016 —— ArticleBody 真实渲染（renderToString + HTML 断言）。
 * 覆盖 GFM 表格 / 链接 / 标题 / 列表 / 图片 / 嵌入帖 / 分隔线。
 */

interface Fixture {
  article_results: {
    result: {
      content_state?: RawArticleContentState
      media_entities?: RawArticleMedia[]
    }
  }
}

function blocksOf(fixture: unknown): ArticleBlock[] {
  const result = (fixture as Fixture).article_results.result
  return parseContentState(result.content_state, result.media_entities)
}

function render(blocks: ArticleBlock[]): string {
  return renderToString(createElement(ArticleBody, { blocks, mode: 'original' }))
}

describe('AC-TWEET-016: ArticleBody real render', () => {
  it('AC-TWEET-016: renders GFM tables and links from MARKDOWN/LINK entities', () => {
    const html = render(blocksOf(mvernalFixture))

    expect(html).toContain('<table')
    expect(html).toContain('href="https://stratechery.com/"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer')
  })

  it('AC-TWEET-016: renders headings, list items and images', () => {
    const html = render(blocksOf(trq212Fixture))

    expect(html).toMatch(/<h[234]/)
    expect(html).toMatch(/<ul|<ol/)
    expect(html).toContain('<img')
    expect(html).toContain('pbs.twimg.com/media/')
  })

  it('AC-TWEET-016: renders embed-tweet and divider blocks', () => {
    const blocks: ArticleBlock[] = [
      { key: 'e', type: 'embed-tweet', tweetId: '2104058634452005231' },
      { key: 'd', type: 'divider' },
    ]
    const html = render(blocks)

    expect(html).toContain('href="https://x.com/i/status/2104058634452005231"')
    expect(html).toContain('data-slot="separator"')
  })
})

/**
 * AC-TWEET-018 —— 三态（原文 / 仅译文 / 双语）渲染差异 + 占位符锚点还原。
 */
describe('AC-TWEET-018: block translation three-state rendering', () => {
  const blocks: ArticleBlock[] = [
    { key: 'h', type: 'heading', level: 1, runs: [{ type: 'text', text: 'Title EN' }] },
    {
      key: 'p',
      type: 'paragraph',
      runs: [
        { type: 'text', text: 'Hello ' },
        { type: 'link', text: 'link', url: 'https://example.com/post' },
      ],
    },
  ]
  const translations = { h: '标题中文', p: '你好 <<__LINK_0__>> 结束' }

  function renderMode(mode: 'original' | 'translation' | 'bilingual'): string {
    return renderToString(createElement(ArticleBody, { blocks, translations, mode }))
  }

  it('AC-TWEET-018: original mode shows only the source text', () => {
    const html = renderMode('original')

    expect(html).toContain('Title EN')
    expect(html).toContain('Hello ')
    expect(html).not.toContain('标题中文')
    expect(html).not.toContain('你好')
  })

  it('AC-TWEET-018: translation mode shows only the translation, restoring placeholders', () => {
    const html = renderMode('translation')

    expect(html).toContain('标题中文')
    expect(html).toContain('你好')
    expect(html).not.toContain('<<__LINK_0__>>')
    expect(html).not.toContain('Title EN')
    // `<<__LINK_0__>>` 还原为第 0 个非文本 run（link）的可点击元素
    expect(html).toContain('href="https://example.com/post"')
  })

  it('AC-TWEET-018: bilingual mode shows source and translation together', () => {
    const html = renderMode('bilingual')

    expect(html).toContain('Title EN')
    expect(html).toContain('标题中文')
    expect(html).toContain('Hello ')
    expect(html).toContain('你好')
  })
})

/**
 * AC-TWEET-019 —— 内嵌推文：阅读页注入的真实推文渲染（`renderEmbed` 委派），
 * 未注入或取数失败时回退轻量链接卡。
 */
describe('AC-TWEET-019: embedded tweet rendering', () => {
  const blocks: ArticleBlock[] = [{ key: 'e', type: 'embed-tweet', tweetId: '2103032879496540640' }]

  it('AC-TWEET-019: delegates embed-tweet blocks to the injected renderer', () => {
    const html = renderToString(createElement(ArticleBody, {
      blocks,
      renderEmbed: tweetId => createElement('div', { 'data-embed': tweetId }, 'embedded'),
    }))

    expect(html).toContain('data-embed="2103032879496540640"')
    // 注入渲染时不产出旧的「在 X 查看」链接卡
    expect(html).not.toContain('x.com/i/status/2103032879496540640')
  })

  it('AC-TWEET-019: falls back to the link card when the renderer has no data', () => {
    const html = renderToString(createElement(ArticleBody, {
      blocks,
      renderEmbed: () => undefined,
    }))

    expect(html).toContain('href="https://x.com/i/status/2103032879496540640"')
  })
})
