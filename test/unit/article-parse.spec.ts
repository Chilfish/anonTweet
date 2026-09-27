import type { RawArticleContentState, RawArticleMedia } from '~/lib/rettiwt-api/types/raw/tweet/Details'
import type { ArticleBlock, ArticleRun } from '~/types'
/**
 * test/unit/article-parse.spec.ts
 *
 * AC-TWEET-014：Draft.js `content_state` → 块文档。
 * 覆盖四种真实样例（fixtures 由 `scripts/tmp-dump-article.ts` 冻结）：
 * - 纯段落 + hashtag span + 行内粗体（日文公告）
 * - MARKDOWN（GFM 表格）+ LINK 实体 + mention span（Moats 一文）
 * - header / unordered-list / MEDIA 图片（Claude effort 一文）
 * - 只覆盖段首的 Bold 区间（style 边界切分回归；日文故障报告）
 */
import { describe, expect, it } from 'vitest'
import { collectEmbeddedTweetIds, derivePlainText, parseContentState } from '~/lib/article/parse'
import mvernalFixture from '../fixtures/articles/2099885132379500562.json'
import boldRangeFixture from '../fixtures/articles/2103463356913098908.json'
import trq212Fixture from '../fixtures/articles/2103576349499855160.json'
import bandDreamFixture from '../fixtures/articles/2104058634452005231.json'
import embedRichFixture from '../fixtures/articles/2104076282107723935.json'

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

function allRuns(blocks: ArticleBlock[]): ArticleRun[] {
  return blocks.flatMap(block => ('runs' in block ? block.runs : []))
}

describe('AC-TWEET-014: parseContentState', () => {
  it('AC-TWEET-014: returns [] for missing/empty content_state', () => {
    expect(parseContentState(undefined)).toEqual([])
    expect(parseContentState({ blocks: [] })).toEqual([])
  })

  it('AC-TWEET-014: maps plain paragraphs, hashtag spans and inline styles', () => {
    const blocks = blocksOf(bandDreamFixture)

    expect(blocks).toHaveLength(6)
    expect(blocks.every(block => block.type === 'paragraph')).toBe(true)

    const runs = allRuns(blocks)
    expect(runs.some(run => run.type === 'hashtag' && run.href.includes('/hashtag/'))).toBe(true)
    expect(runs.some(run => run.styles?.includes('bold'))).toBe(true)
  })

  it('AC-TWEET-014: applies Bold only to the styled range, not the whole block', () => {
    // 回归：`{offset:0,length:15,style:Bold}` 曾把整段渲染成粗体——样式边界必须是切分点
    const blocks = blocksOf(boldRangeFixture)
    const block = blocks.find(b => b.key === 'b0tca')

    expect(block?.type).toBe('paragraph')
    if (!block || block.type !== 'paragraph')
      throw new Error('expected paragraph block b0tca')

    const boldRun = block.runs.find(run => run.styles?.includes('bold'))
    expect(boldRun?.text.trim()).toBe('1.不具合の発生と原因の特定')

    const rest = block.runs.filter(run => !run.styles?.includes('bold')).map(run => run.text).join('')
    expect(rest).toContain('リリース以降')
    expect(rest).not.toContain('1.不具合の発生と原因の特定')
  })

  it('AC-TWEET-014: maps LINK entities and mention spans to runs', () => {
    const blocks = blocksOf(mvernalFixture)
    const runs = allRuns(blocks)

    expect(runs.some(run => run.type === 'link' && run.url === 'https://stratechery.com/')).toBe(true)
    expect(runs.some(run => run.type === 'mention' && run.href === 'https://x.com/lennysan')).toBe(true)
  })

  it('AC-TWEET-014: turns MARKDOWN entities into markdown blocks (GFM tables)', () => {
    const blocks = blocksOf(mvernalFixture)
    const markdown = blocks.find(block => block.type === 'markdown')

    expect(markdown).toBeDefined()
    expect(markdown!.type === 'markdown' && markdown!.text).toContain('| The New York Times |')

    const plain = derivePlainText(blocks)
    expect(plain).toContain('| Newspaper | 2002 Print Circulation |')
  })

  it('AC-TWEET-014: maps headings, list items and MEDIA images correctly', () => {
    const blocks = blocksOf(trq212Fixture)

    expect(blocks.some(block => block.type === 'heading')).toBe(true)
    expect(blocks.some(block => block.type === 'list-item' && !block.ordered)).toBe(true)

    const images = blocks.filter(block => block.type === 'image')
    expect(images.length).toBeGreaterThan(0)
    expect(images[0]!.type === 'image' && images[0]!.media.url).toContain('https://pbs.twimg.com/media/')
  })

  it('AC-TWEET-019: collects the article embed-tweet ids in order, de-duplicated', () => {
    const blocks = blocksOf(embedRichFixture)

    expect(collectEmbeddedTweetIds(blocks)).toEqual([
      '2103032879496540640',
      '2103768558429958335',
      '2104037017873162442',
      '2103868710561911209',
    ])

    const duplicated: ArticleBlock[] = [
      { key: 'a', type: 'embed-tweet', tweetId: '111' },
      { key: 'b', type: 'paragraph', runs: [{ type: 'text', text: 'x' }] },
      { key: 'c', type: 'embed-tweet', tweetId: '222' },
      { key: 'd', type: 'embed-tweet', tweetId: '111' },
    ]
    expect(collectEmbeddedTweetIds(duplicated)).toEqual(['111', '222'])
  })
})
