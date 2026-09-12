import type { Meta, StoryObj } from '@storybook/react-vite'
import { IGStoryMeta } from '~/components/ins/IGStoryMeta'
import { highlightPost, makePost, storyPost } from './ig.fixtures'

/**
 * IGStoryMeta —— Story / Highlight 专属元信息行。
 * 场景：链接贴纸 / 精选标题 + 转发来源 / 普通帖子不渲染（空态）。
 */
const meta = {
  title: 'Instagram/StoryMeta',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const LinkSticker: Story = {
  render: () => (
    <div className="w-[400px] bg-card rounded-sm">
      <IGStoryMeta post={storyPost} />
    </div>
  ),
}

export const HighlightTitle: Story = {
  render: () => (
    <div className="w-[400px] bg-card rounded-sm">
      <IGStoryMeta post={highlightPost} />
    </div>
  ),
}

/** 普通帖子：返回 null（不额外渲染任何内容） */
export const OnNormalPost: Story = {
  render: () => (
    <div className="w-[400px] bg-card rounded-sm p-4 text-xs text-muted-foreground">
      <IGStoryMeta post={makePost()} />
      （普通帖子：上方无内容）
    </div>
  ),
}
