import type { Meta, StoryObj } from '@storybook/react-vite'
import { IGStoryListSkeleton } from '~/components/ins/IGStoryListSkeleton'

/**
 * IGStoryListSkeleton —— 快拍列表骨架屏。
 *
 * 与加载后的网格同形（工具栏占位 + 12 个方图，列数断点一致），避免数据到达时跳动。
 */
const meta = {
  title: 'Instagram/StoryListSkeleton',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-[720px]">
      <IGStoryListSkeleton />
    </div>
  ),
}
