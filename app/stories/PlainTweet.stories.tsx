import type { Meta, StoryObj } from '@storybook/react-vite'
import { MyPlainTweet } from '~/components/tweet/PlainTweet'
import {
  threadTweets,
  translationThreadTweets,
  tweetEnglish,
  tweetWithCard,
  tweetWithPhotos,
  tweetWithTrendingCard,
} from './tweet.fixtures'

/**
 * MyPlainTweet —— 截图专用纯推文路由（plain.tsx）渲染核心。
 * 场景矩阵：单推 / 多图 / Trending 卡 / 长线程（无翻译）/ 长线程（带 AI 翻译）。
 * 这是 AC-PERF-001 的服务端渲染同源组件，Storybook 提供客户端视觉基线。
 */
const meta = {
  title: 'Tweet/PlainTweet',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const SingleTweet: Story = {
  render: () => (
    <MyPlainTweet
      tweets={[tweetWithCard]}
      mainTweetId={tweetWithCard.id_str}
      enableTranslation={false}
    />
  ),
}

export const MultiPhotoTweet: Story = {
  render: () => (
    <MyPlainTweet
      tweets={[tweetWithPhotos]}
      mainTweetId={tweetWithPhotos.id_str}
      enableTranslation={false}
    />
  ),
}

export const TrendingCardTweet: Story = {
  render: () => (
    <MyPlainTweet
      tweets={[tweetWithTrendingCard]}
      mainTweetId={tweetWithTrendingCard.id_str}
      enableTranslation={false}
    />
  ),
}

export const ThreadNoTranslation: Story = {
  render: () => (
    <MyPlainTweet
      tweets={threadTweets}
      mainTweetId={threadTweets[2]!.id_str}
      enableTranslation={false}
    />
  ),
}

export const ThreadWithTranslation: Story = {
  render: () => (
    <MyPlainTweet
      tweets={translationThreadTweets}
      mainTweetId={tweetEnglish.id_str}
      enableTranslation
    />
  ),
}
