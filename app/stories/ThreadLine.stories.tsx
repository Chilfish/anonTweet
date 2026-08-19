import type { Meta, StoryObj } from '@storybook/react-vite'
import { ThreadLine } from '~/components/tweet/ThreadLine'

/**
 * ThreadLine —— 评论/祖先节点的纵向连线（主题色分明的浅/暗双态）。
 * 需放置于 `relative` 容器内，用 topOffset/bottomOffset 对齐头像中心。
 */
const meta = {
  title: 'Tweet/ThreadLine',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="relative h-40 w-10 bg-background">
      <ThreadLine topOffset={8} bottomOffset={16} />
    </div>
  ),
}

export const FullSpan: Story = {
  render: () => (
    <div className="relative h-80 w-10 rounded bg-background">
      <ThreadLine />
    </div>
  ),
}

export const Hidden: Story = {
  render: () => (
    <div className="relative h-40 w-10 bg-background">
      <ThreadLine visible={false} />
    </div>
  ),
}
