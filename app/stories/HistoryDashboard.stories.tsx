import type { Meta, StoryObj } from '@storybook/react-vite'
import type { VisitedEvent, VisitedItem } from '~/lib/visited'
import { HistoryActivity } from '~/components/history/HistoryActivity'
import { HistoryInsights } from '~/components/history/HistoryInsights'
import { HistoryList } from '~/components/history/HistoryList'
import { HistoryOverview } from '~/components/history/HistoryOverview'
import { HistoryPagination } from '~/components/history/HistoryPagination'
import { HistoryTable } from '~/components/history/HistoryTable'
import { HistoryToolbar } from '~/components/history/HistoryToolbar'
import { computeVisitedStats, topVisitedAuthors } from '~/lib/visited-analytics'

/**
 * /history 的最终形态：无卡片总览、每 7 天分布、全历史热力图、
 * 常看作者 / 时段洞察、列表与表格两种记录视图。
 */
const meta = {
  title: 'History/Dashboard',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-3xl bg-background p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const NOW = Date.now()
const DAY = 86_400_000

const items: VisitedItem[] = [
  {
    type: 'tweet',
    id: '2032649981690261684',
    title: 'Chilfish',
    snippet: '匿名查看推文、回复与 X 长文，保留原文与译文两套视图。',
    image: '/icon.webp',
    author: 'Chilfish',
    authorHandle: 'Chilfish',
    ts: NOW - 5 * 60_000,
    firstTs: NOW - 30 * DAY,
    visits: 12,
  },
  {
    type: 'ig',
    id: 'DWlrun0AVbE',
    title: '@meeeei.gt',
    snippet: '今日份的照片与 caption 翻译。',
    image: '/icon.webp',
    author: '@meeeei.gt',
    authorHandle: 'meeeei.gt',
    ts: NOW - 3 * 3_600_000,
    firstTs: NOW - 20 * DAY,
    visits: 6,
  },
  {
    type: 'article',
    id: '2032649981690261684',
    title: '关于匿名阅读的十个细节',
    snippet: '块文档、按块翻译与截图导出。',
    author: 'Chilfish',
    authorHandle: 'Chilfish',
    ts: NOW - 26 * 3_600_000,
    firstTs: NOW - 40 * DAY,
    visits: 3,
  },
  {
    type: 'tweet',
    id: '2032649981690261500',
    title: '日文推文整理',
    snippet: '生词标注与双语对照。',
    author: 'Yuki',
    authorHandle: 'yuki_ja',
    ts: NOW - 2 * DAY,
    firstTs: NOW - 12 * DAY,
    visits: 8,
  },
  {
    type: 'tweet',
    id: '2032649981690261400',
    title: '设计师日常',
    snippet: '关于信息密度与渐进披露的讨论。',
    author: 'Mika',
    authorHandle: 'mika_design',
    ts: NOW - 4 * DAY,
    firstTs: NOW - 60 * DAY,
    visits: 4,
  },
  {
    type: 'ig',
    id: 'DWlrun0AVbA',
    title: '@photo.archive',
    snippet: '周末的照片合集。',
    author: '@photo.archive',
    authorHandle: 'photo.archive',
    ts: NOW - 9 * DAY,
    firstTs: NOW - 90 * DAY,
    visits: 2,
  },
]

const events: VisitedEvent[] = [
  ...items.flatMap(item =>
    Array.from({ length: item.visits ?? 1 }, (_, index) => ({
      ts: item.ts - index * 6 * 3_600_000,
      type: item.type,
      targetId: item.id,
    })),
  ),
  ...Array.from({ length: 18 }, (_, index) => ({
    ts: NOW - (18 + index * 9) * DAY + 10 * 3_600_000,
    type: 'tweet' as const,
    targetId: `old-${index}`,
  })),
]

const stats = computeVisitedStats(items, events, NOW)
const authors = topVisitedAuthors(items, 20)

const query = {
  q: '',
  type: 'all' as const,
  range: 'all' as const,
  author: '',
  view: 'list' as const,
  group: 'date' as const,
  sort: 'recent' as const,
}

export const Overview: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <HistoryOverview stats={stats} />
      <HistoryActivity items={items} events={events} now={NOW} />
      <HistoryInsights
        items={items}
        events={events}
        onAuthorSelect={() => {}}
      />
      <HistoryToolbar
        query={query}
        authors={authors}
        isFiltered={false}
        onChange={() => {}}
        onClear={() => {}}
      />
      <HistoryList
        items={items}
        groupBy="date"
        now={NOW}
        onRemove={() => {}}
      />
    </div>
  ),
}

export const AuthorGroups: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <HistoryOverview stats={stats} />
      <HistoryList
        items={items}
        groupBy="author"
        now={NOW}
        onRemove={() => {}}
      />
    </div>
  ),
}

export const Table: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <HistoryOverview stats={stats} />
      <HistoryToolbar
        query={{ ...query, view: 'table', sort: 'visits' }}
        authors={authors}
        isFiltered
        onChange={() => {}}
        onClear={() => {}}
      />
      <HistoryTable items={items} now={NOW} onRemove={() => {}} />
    </div>
  ),
}

export const ActivityOnly: Story = {
  render: () => <HistoryActivity items={items} events={events} now={NOW} />,
}

export const Pagination: Story = {
  render: () => (
    <HistoryPagination
      page={2}
      pageCount={3}
      total={60}
      pageStart={21}
      pageEnd={40}
      pageSize={20}
      onPageChange={() => {}}
      onPageSizeChange={() => {}}
    />
  ),
}
