import type { Meta, StoryObj } from '@storybook/react-vite'
import { TweetLinkCard } from '~/components/tweet/TweetCard'
import {
  tweetNoCard,
  tweetTrendingNoImage,
  tweetWithCard,
  tweetWithCarouselCard,
  tweetWithLargeImageCard,
  tweetWithSingleImageCard,
  tweetWithTextOnlyCard,
  tweetWithTrendingCard,
  tweetWithVideoCard,
} from './tweet.fixtures'

/**
 * TweetLinkCard 五态场景（review-2026-08-19 P1-1 建议①）：
 * 默认摘要卡 / 宽幅大图卡 / 纯文字卡 / Trending 官方变体 / Trending 缺图回退 / 无卡空渲染。
 * 视觉输入 = 真实 fixture 数据（test/fixtures 同源），对照官方渲染（cache/trending.html）。
 */
const meta = {
  title: 'Tweet/Card',
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

export const SummaryCard: Story = {
  render: () => <TweetLinkCard tweet={tweetWithCard} />,
}

export const LargeImageCard: Story = {
  render: () => <TweetLinkCard tweet={tweetWithLargeImageCard} />,
}

/** 多图轮播卡（官方同款横向轮播；点击右下角图标可切平铺） */
export const CarouselCard: Story = {
  render: () => <TweetLinkCard tweet={tweetWithCarouselCard} />,
}

/** 单图图片卡（4:5 竖图按原比例展示，不再裁成 1.91:1） */
export const SingleImageCard: Story = {
  render: () => <TweetLinkCard tweet={tweetWithSingleImageCard} />,
}

/** 视频卡（封面 + 播放按钮 + 时长 badge，不做内嵌播放） */
export const VideoCard: Story = {
  render: () => <TweetLinkCard tweet={tweetWithVideoCard} />,
}

export const TextOnlyCard: Story = {
  render: () => <TweetLinkCard tweet={tweetWithTextOnlyCard} />,
}

/** 官方 Trending 变体（真实 jetfuel 数据：分类/头像组/posts/标题/描述） */
export const TrendingCard: Story = {
  render: () => <TweetLinkCard tweet={tweetWithTrendingCard} />,
}

/** trending 存在但主图缺失 → 布局不塌陷（P1-3 回退路径） */
export const TrendingMissingImage: Story = {
  render: () => <TweetLinkCard tweet={tweetTrendingNoImage} />,
}

/** 无卡片数据 → 空渲染（骨架由上层提供） */
export const NoCardData: Story = {
  render: () => <TweetLinkCard tweet={tweetNoCard} />,
}

/** 移动端窄屏（<360px）：检查卡片在窄宽下的换行与截断 */
export const MobileNarrow: Story = {
  render: () => (
    <div className="w-[320px] bg-card p-2">
      <TweetLinkCard tweet={tweetWithTrendingCard} />
      <TweetLinkCard tweet={tweetWithLargeImageCard} />
    </div>
  ),
}
