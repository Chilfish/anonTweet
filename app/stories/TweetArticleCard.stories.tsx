import type { Meta, StoryObj } from '@storybook/react-vite'
import { TweetArticleCard } from '~/components/tweet/TweetArticleCard'
import { articleMarkdown, articleRich } from './article.fixtures'

/**
 * 推文内 X Article 紧凑卡（TweetArticleCard）：封面 + 标题 + 摘要 + 阅读入口。
 */
const meta = {
  title: 'Tweet/ArticleCard',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-[520px] bg-card p-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const WithCover: Story = {
  render: () => <TweetArticleCard article={articleRich} tweetId={articleRich.id} />,
}

export const WithoutCover: Story = {
  render: () => <TweetArticleCard article={{ ...articleMarkdown, coverImage: undefined }} tweetId={articleMarkdown.id} />,
}
