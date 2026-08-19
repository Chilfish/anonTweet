import type { Meta, StoryObj } from '@storybook/react-vite'
import { CommentBranch } from '~/components/tweet/CommentBranch'
import { tweetWithComments, tweetWithQuoted } from './tweet.fixtures'

/**
 * CommentBranch —— 评论树分支：线程连线（ThreadLine）+ 可选中节点 + 递归回复。
 * 场景：顶层带回复 / 单条无回复（叶子）/ 引推回复。
 */
const meta = {
  title: 'Tweet/CommentBranch',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const TopLevelWithReplies: Story = {
  render: () => (
    <div className="w-full max-w-[560px] bg-card">
      <CommentBranch tweet={tweetWithComments} isTopLevel />
    </div>
  ),
}

export const LeafNoReplies: Story = {
  render: () => (
    <div className="w-full max-w-[560px] bg-card">
      <CommentBranch tweet={tweetWithQuoted} isTopLevel={false} />
    </div>
  ),
}
