import type { Meta, StoryObj } from '@storybook/react-vite'
import { TrendingCardView } from '~/components/tweet/TrendingCard'
import { trendingInfo } from './tweet.fixtures'

/**
 * TrendingCardView —— 官方 X Trending 卡片（aspect 18:10 + 底部覆盖层）。
 * 拆自 TweetCard.tsx（review P2-1）；主图 alt 空（装饰图），标题 h3 承载可访问名称。
 */
const meta = {
  title: 'Tweet/TrendingCard',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-[420px] bg-card p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** 真实 jetfuel 解析数据：分类行 + 标题 + 头像组 + 16.5k posts + 描述 */
export const Default: Story = {
  render: () => <TrendingCardView trending={trendingInfo} />,
}

/** 主图缺失：MediaImage 错误占位，容器与文字不塌陷 */
export const MissingImage: Story = {
  render: () => <TrendingCardView trending={{ ...trendingInfo, imageUrl: '' }} />,
}

/** 无描述（描述为可选字段） */
export const NoDescription: Story = {
  render: () => (
    <TrendingCardView trending={{ ...trendingInfo, description: undefined }} />
  ),
}

/** 长标题（20+ 字）验证 line-clamp-3 */
export const LongTitle: Story = {
  render: () => (
    <TrendingCardView
      trending={{
        ...trendingInfo,
        title: 'これはとても長いトレンドタイトルのサンプルです。三行で切れるはずです。もっと長くして改行されることを確認するための文章。',
      }}
    />
  ),
}
