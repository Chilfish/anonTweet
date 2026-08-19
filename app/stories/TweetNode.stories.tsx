import type { Meta, StoryObj } from '@storybook/react-vite'
import { TweetNode } from '~/components/tweet/TweetNode'
import { tweetWithCard, tweetWithPhotos, tweetWithQuoted, tweetWithTrendingCard } from './tweet.fixtures'

/**
 * TweetNode —— 单条推文节点（头部 + 正文 + 媒体 + 卡片 + 引推）。
 * 场景：main 变体 / thread 变体（缩进 + 头像偏移）/ quoted 变体（带引推）/ 含 Trending 卡。
 */
const meta = {
  title: 'Tweet/Node',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-[560px] bg-card">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Main: Story = {
  render: () => <TweetNode tweet={tweetWithCard} variant="main" />,
}

export const MainWithTrendingCard: Story = {
  render: () => <TweetNode tweet={tweetWithTrendingCard} variant="main" />,
}

export const MainWithPhotos: Story = {
  render: () => <TweetNode tweet={tweetWithPhotos} variant="main" />,
}

export const ThreadVariant: Story = {
  render: () => <TweetNode tweet={tweetWithCard} variant="thread" hasParent />,
}

/** quoted 变体：外框 + 内部引推嵌套节点 */
export const Quoted: Story = {
  render: () => <TweetNode tweet={tweetWithQuoted} variant="main" />,
}
