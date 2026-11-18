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
import { CapabilityStrip } from '~/components/home/CapabilityStrip'
import { ContinueReading } from '~/components/home/ContinueReading'
import { RecentVisited } from '~/components/home/RecentVisited'
import { Dateline } from '~/components/layout/Dateline'
import { FloatingDock } from '~/components/layout/FloatingDock'
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
  it('renders one link per entry with type-specific href', () => {
    const html = render(createElement(RecentVisited, { items }))

    expect(html).toContain('href="/tweets/111"')
    expect(html).toContain('href="/ins/abc%2Fdef"')
    expect(html).toContain('href="/article/222"')
    expect(html).toContain('Alice')
    expect(html).toContain('hello world')
    expect(html).toContain('caption text')
    expect(html).toContain('5 分钟前')
    expect(html).toContain('最近查看')
  })

  it('renders nothing for an empty list', () => {
    expect(render(createElement(RecentVisited, { items: [] }))).toBe('')
  })

  it('renders the latest entry as a continue-reading card', () => {
    const html = render(createElement(ContinueReading, { item: items[0]! }))

    expect(html).toContain('继续阅读')
    expect(html).toContain('href="/tweets/111"')
    expect(html).toContain('Alice')
    expect(html).toContain('hello world')
    expect(html).not.toContain('最近查看')
  })

  it('hides the continue-reading card without history', () => {
    expect(render(createElement(ContinueReading, { item: null }))).toBe('')
  })
})

describe('AC-HOME-002: home search entry and capability strip', () => {
  it('offers a search entry when there is no link at hand', () => {
    const html = render(createElement(TweetInputForm))

    expect(html).toContain('href="/search"')
    expect(html).toContain('搜索推文')
  })

  it('lists the three real capabilities without link or subtitle markup', () => {
    const html = render(createElement(CapabilityStrip))

    expect(html).toContain('AI 翻译')
    expect(html).toContain('截图导出')
    expect(html).toContain('Markdown')
    expect(html).not.toContain('<a ')
    expect(html).not.toContain('href=')
  })

  it('exposes global navigation through the floating dock', () => {
    const html = render(createElement(FloatingDock))

    expect(html).toContain('aria-label="首页"')
    expect(html).toContain('aria-label="搜索推文"')
    expect(html).toContain('aria-label="设置"')
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
