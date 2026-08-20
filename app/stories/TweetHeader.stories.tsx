import type { Meta, StoryObj } from '@storybook/react-vite'
import { TweetHeader } from '~/components/tweet/TweetHeader'
import { seedUI, WithStoreState } from './story.store'

/**
 * TweetHeader —— 推文页顶栏：返回 + 筛选开关 + 加载评论 + 翻译开关 + 截图 + 菜单。
 * Router 上下文由 .storybook/preview.ts 全局提供（单一 MemoryRouter）。
 * 场景：默认 / 加载评论中 / 无主推文（按钮禁用）/ 移动端窄屏 / 选择模式。
 */
const meta = {
  title: 'Tweet/Header',
  component: TweetHeader,
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-[700px] bg-background p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TweetHeader>

export default meta

type Story = StoryObj<typeof meta>

async function noop() {}

export const Default: Story = {
  args: {
    isLoadingComments: false,
    loadComments: noop,
    hasTweets: true,
    hasMainTweet: true,
  },
}

export const LoadingComments: Story = {
  args: {
    isLoadingComments: true,
    loadComments: noop,
    hasTweets: true,
    hasMainTweet: true,
  },
}

export const NoMainTweet: Story = {
  args: {
    isLoadingComments: false,
    loadComments: noop,
    hasTweets: false,
    hasMainTweet: false,
  },
}

/** 移动端窄屏（顶栏按钮群换行/隐藏文字标签） */
export const MobileNarrow: Story = {
  args: {
    isLoadingComments: false,
    loadComments: noop,
    hasTweets: true,
    hasMainTweet: true,
  },
  decorators: [
    () => (
      <div className="w-[360px] bg-background p-2">
        <TweetHeader
          isLoadingComments={false}
          loadComments={noop}
          hasTweets
          hasMainTweet
        />
      </div>
    ),
  ],
}

/** 选择模式（开启时截图按钮组切换为全选/取消/截图） */
export const SelectionMode: Story = {
  args: {
    isLoadingComments: false,
    loadComments: noop,
    hasTweets: true,
    hasMainTweet: true,
  },
  render: () => (
    <WithStoreState seed={() => seedUI({
      isSelectionMode: true,
      selectedTweetIds: ['9000000000000000201', '9000000000000000202'],
    })}
    >
      <TweetHeader
        isLoadingComments={false}
        loadComments={noop}
        hasTweets
        hasMainTweet
      />
    </WithStoreState>
  ),
}
