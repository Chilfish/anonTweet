import type { Meta, StoryObj } from '@storybook/react-vite'
import type { VisitedItem } from '~/lib/visited'
import { RecentVisited } from '~/components/home/RecentVisited'

/**
 * 首页次级区块：最近查看（有记录 / 空态）。
 * 空态用于确认「无记录时整块不渲染」，不留下空洞。
 */
const meta = {
  title: 'Home/RecentVisited',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-md bg-background p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const items: VisitedItem[] = [
  {
    type: 'tweet',
    id: '2032649981690261684',
    title: 'Chilfish',
    snippet: '匿名查看推文、回复与 X 长文，保留原文与译文两套视图。',
    image: '/icon.webp',
    ts: Date.now() - 5 * 60_000,
  },
  {
    type: 'ig',
    id: 'DWlrun0AVbE',
    title: '@meeeei.gt',
    snippet: '今日份的照片与 caption 翻译。',
    image: '/icon.webp',
    ts: Date.now() - 3 * 3_600_000,
  },
  {
    type: 'article',
    id: '2032649981690261684',
    title: '关于匿名阅读的十个细节',
    snippet: '块文档、按块翻译与截图导出。',
    ts: Date.now() - 2 * 86_400_000,
  },
]

export const Populated: Story = {
  render: () => <RecentVisited items={items} onClear={() => {}} />,
}

export const Empty: Story = {
  render: () => <RecentVisited items={[]} />,
}
