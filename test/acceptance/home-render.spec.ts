/**
 * test/acceptance/home-render.spec.ts
 *
 * AC-HOME-001：最近查看渲染为可点击链接，空列表不占位。
 * AC-HOME-004：历史 dashboard 的总览、活动、洞察、列表与表格渲染。
 * AC-HOME-002：全局导航（悬浮簇）与装饰元素（朱印 / 日付线），以及首页搜索入口。
 */
import type { VisitedEvent, VisitedItem } from '~/lib/visited'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { HistoryActivity } from '~/components/history/HistoryActivity'
import { HistoryInsights } from '~/components/history/HistoryInsights'
import { HistoryList } from '~/components/history/HistoryList'
import { HistoryOverview } from '~/components/history/HistoryOverview'
import { HistoryPagination } from '~/components/history/HistoryPagination'
import { HistoryTable } from '~/components/history/HistoryTable'
import { HistoryToolbar } from '~/components/history/HistoryToolbar'
import { RecentVisited } from '~/components/home/RecentVisited'
import { Dateline } from '~/components/layout/Dateline'
import { HankoMark } from '~/components/layout/HankoMark'
import { TweetInputForm } from '~/components/tweet/TweetInputForm'
import { computeVisitedStats, topVisitedAuthors } from '~/lib/visited-analytics'

/** 相对时间与日期分组都按真实时间计算；跨零点运行时用宽松断言避免抖动 */
const NOW = Date.now()
const DATE_LINE_RE = /\d{4}\.\d{2}\.\d{2}/
const MONTH_DAY_RE = /\d+月\d+日/
const RELATIVE_TIME_RE = /刚刚|分钟前/
const DAY_GROUP_RE = /今天|昨天/

const items: VisitedItem[] = [
  {
    type: 'tweet',
    id: '111',
    title: 'Alice',
    snippet: 'hello world',
    author: 'Alice',
    authorHandle: 'alice',
    visits: 3,
    ts: NOW - 5 * 60_000,
  },
  {
    type: 'ig',
    id: 'abc/def',
    title: '@bob',
    snippet: 'caption text',
    author: '@bob',
    authorHandle: 'bob',
    visits: 2,
    ts: NOW - 2 * 3_600_000,
  },
  {
    type: 'article',
    id: '222',
    title: 'Long read',
    author: 'Alice',
    authorHandle: 'alice',
    visits: 1,
    ts: NOW - 30 * 86_400_000,
  },
]

const events: VisitedEvent[] = items.flatMap(item =>
  Array.from({ length: item.visits ?? 1 }, (_, index) => ({
    ts: item.ts - index * 60_000,
    type: item.type,
    targetId: item.id,
  })),
)

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
    expect(html).toMatch(RELATIVE_TIME_RE)
    expect(html).toContain('最近查看')
  })

  it('renders nothing for an empty list', () => {
    expect(render(createElement(RecentVisited, { items: [] }))).toBe('')
  })
})

describe('AC-HOME-004: history dashboard renders without card containers', () => {
  const stats = computeVisitedStats(items, events, NOW)

  it('renders the summary strip with streaks and type breakdown', () => {
    const html = render(createElement(HistoryOverview, { stats }))

    expect(html).toContain('条记录')
    expect(html).toContain('次浏览')
    expect(html).toContain('位作者')
    expect(html).toContain('天活跃')
    expect(html).toContain('当前连续')
    expect(html).toContain('推文')
    expect(html).toContain('Instagram')
  })

  it('renders the all-history heatmap without card containers', () => {
    const html = render(createElement(HistoryActivity, {
      items,
      events,
      now: NOW,
    }))

    expect(html).toContain('浏览活动')
    expect(html).toContain('每日热力图')
    expect(html).toContain('aria-label="浏览活动"')
    expect(html).not.toContain('rounded-2xl')
  })

  it('renders top authors and the hour distribution', () => {
    const html = render(createElement(HistoryInsights, {
      items,
      events,
      onAuthorSelect: () => {},
    }))

    expect(html).toContain('常看作者')
    expect(html).toContain('按浏览次数')
    expect(html).toContain('浏览时段')
    expect(html).toContain('Alice')
  })

  it('renders search, filters and the view switch', () => {
    const html = render(createElement(HistoryToolbar, {
      query: {
        q: 'hello',
        type: 'tweet',
        range: '7d',
        author: '',
        view: 'list',
        group: 'date',
        sort: 'recent',
      },
      authors: topVisitedAuthors(items, 10),
      isFiltered: true,
      onChange: () => {},
      onClear: () => {},
    }))

    expect(html).toContain('搜索浏览历史')
    expect(html).toContain('value="hello"')
    expect(html).toContain('aria-label="作者筛选"')
    expect(html).toContain('aria-label="时间范围"')
    expect(html).toContain('aria-label="视图"')
    expect(html).toContain('近 7 天')
    expect(html).toContain('清除')
  })

  it('renders pagination with page size and range', () => {
    const html = render(createElement(HistoryPagination, {
      page: 2,
      pageCount: 3,
      total: 60,
      pageStart: 21,
      pageEnd: 40,
      pageSize: 20,
      onPageChange: () => {},
      onPageSizeChange: () => {},
    }))

    expect(html).toContain('21–40 / 60')
    expect(html).toContain('2 / 3')
    expect(html).toContain('aria-label="每页条数"')
    expect(html).toContain('20 条/页')
    expect(html).toContain('aria-label="第一页"')
    expect(html).toContain('aria-label="最后一页"')
  })
})

describe('AC-HOME-004: history record views', () => {
  it('groups list rows by day and links each record to its detail page', () => {
    const html = render(createElement(HistoryList, {
      items,
      groupBy: 'date',
      now: NOW,
      onRemove: () => {},
    }))

    expect(html).toMatch(DAY_GROUP_RE)
    expect(html).toMatch(MONTH_DAY_RE)
    expect(html).toContain('href="/tweets/111"')
    expect(html).toContain('href="/ins/abc%2Fdef"')
    expect(html).toContain('href="/article/222"')
    expect(html).toContain('aria-label="移除 Alice"')
    expect(html).toContain('aria-label="移除 Long read"')
    expect(html).toContain('3 次')
  })

  it('groups list rows by author with visit totals', () => {
    const html = render(createElement(HistoryList, {
      items,
      groupBy: 'author',
      now: NOW,
      onRemove: () => {},
    }))

    expect(html).toContain('Alice')
    expect(html).toContain('@bob')
    expect(html).toContain('2 条 · 4 次')
  })

  it('renders a dense table with author, type, visits and time', () => {
    const html = render(createElement(HistoryTable, {
      items,
      now: NOW,
      onRemove: () => {},
    }))

    expect(html).toContain('内容')
    expect(html).toContain('作者')
    expect(html).toContain('类型')
    expect(html).toContain('浏览')
    expect(html).toContain('最近')
    expect(html).toContain('href="/tweets/111"')
    expect(html).toContain('Alice')
    expect(html).toContain('推文')
  })

  it('renders nothing for an empty list', () => {
    expect(render(createElement(HistoryList, { items: [], groupBy: 'date', now: NOW }))).toBe('')
    expect(render(createElement(HistoryTable, { items: [], now: NOW }))).toBe('')
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
