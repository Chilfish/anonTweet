/**
 * test/acceptance/home-render.spec.ts
 *
 * AC-HOME-001：最近查看渲染为可点击链接，空列表不占位。
 * AC-HOME-002：全局导航（悬浮簇）与装饰元素（朱印 / 日付线），以及首页搜索入口。
 */
import type { VisitedItem } from '~/lib/visited'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { HistoryList } from '~/components/history/HistoryList'
import { RecentVisited } from '~/components/home/RecentVisited'
import { Dateline } from '~/components/layout/Dateline'
import { HankoMark } from '~/components/layout/HankoMark'
import { TweetInputForm } from '~/components/tweet/TweetInputForm'

const NOW = Date.now()
const DATE_LINE_RE = /\d{4}\.\d{2}\.\d{2}/

const items: VisitedItem[] = [
  {
    type: 'tweet',
    id: '111',
    title: 'Alice',
    snippet: 'hello world',
    ts: NOW - 5 * 60_000,
  },
  {
    type: 'ig',
    id: 'abc/def',
    title: '@bob',
    snippet: 'caption text',
    ts: NOW - 2 * 3_600_000,
  },
  {
    type: 'article',
    id: '222',
    title: 'Long read',
    ts: new Date(2026, 0, 9).getTime(),
  },
]

function render(node: React.ReactElement): string {
  return renderToString(createElement(MemoryRouter, null, node))
}

describe('AC-HOME-001: recent visited renders as links and hides when empty', () => {
  it('renders one link per entry with type-specific href and a link to the full history', () => {
    const html = render(createElement(RecentVisited, { items }))

    expect(html).toContain('href="/tweets/111"')
    expect(html).toContain('href="/ins/abc%2Fdef"')
    expect(html).toContain('href="/article/222"')
    expect(html).toContain('href="/history"')
    expect(html).toContain('全部')
    expect(html).toContain('Alice')
    expect(html).toContain('hello world')
    expect(html).toContain('caption text')
    expect(html).toContain('5 分钟前')
    expect(html).toContain('最近查看')
  })

  it('renders nothing for an empty list', () => {
    expect(render(createElement(RecentVisited, { items: [] }))).toBe('')
  })
})

describe('AC-HOME-004: history list renders grouped rows with remove actions', () => {
  it('groups rows by day and links each record to its detail page', () => {
    const html = render(createElement(HistoryList, {
      items,
      now: NOW,
      onRemove: () => {},
    }))

    expect(html).toContain('今天')
    expect(html).toContain('更早')
    expect(html).toContain('href="/tweets/111"')
    expect(html).toContain('href="/ins/abc%2Fdef"')
    expect(html).toContain('href="/article/222"')
    expect(html).toContain('aria-label="移除 Alice"')
    expect(html).toContain('aria-label="移除 Long read"')
  })

  it('renders nothing for an empty list', () => {
    expect(render(createElement(HistoryList, { items: [], now: NOW }))).toBe('')
  })
})

describe('AC-HOME-002: home entries and decorative shell', () => {
  it('offers search and settings on the same row, plus the input format list', () => {
    const html = render(createElement(TweetInputForm))

    expect(html).toContain('href="/search"')
    expect(html).toContain('搜索推文')
    expect(html).toContain('aria-label="设置"')
    expect(html).toContain('支持格式')
    expect(html).toContain('instagram.com/reel/')
  })

  it('renders the decorative hanko and dateline', () => {
    const hanko = renderToString(createElement(HankoMark))
    const dateline = renderToString(createElement(Dateline, { label: '推文' }))

    expect(hanko).toContain('あ')
    expect(hanko).toContain('aria-hidden')
    expect(dateline).toContain('推文')
    expect(dateline).toMatch(DATE_LINE_RE)
  })
})
