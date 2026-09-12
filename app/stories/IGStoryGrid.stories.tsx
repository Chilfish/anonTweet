import type { Meta, StoryObj } from '@storybook/react-vite'
import { IGStoryGrid } from '~/components/ins/IGStoryGrid'
import { highlightPost, storyPost, trayPosts, trayPostsMany } from './ig.fixtures'

/**
 * IGStoryGrid —— 快拍相册缩略图网格。
 *
 * 浏览态（点格开查看器）/ 选择态（点格勾选）/ 32 条稠密。
 * 视频角标与「含链接贴纸」标记分别在 story-2、storyPost 上可见。
 */
const meta = {
  title: 'Instagram/StoryGrid',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Browsing: Story = {
  render: () => (
    <div className="w-[720px]">
      <IGStoryGrid posts={[storyPost, highlightPost, ...trayPosts]} />
    </div>
  ),
}

export const SelectionMode: Story = {
  render: () => (
    <div className="w-[720px]">
      <IGStoryGrid
        posts={[storyPost, highlightPost, ...trayPosts]}
        selectable
        selected={new Set([storyPost.id, trayPosts[1]!.id])}
        onToggle={() => undefined}
      />
    </div>
  ),
}

export const DenseTray: Story = {
  render: () => (
    <div className="w-[720px]">
      <IGStoryGrid posts={trayPostsMany} />
    </div>
  ),
}
