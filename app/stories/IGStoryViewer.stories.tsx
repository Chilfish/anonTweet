import type { Meta, StoryObj } from '@storybook/react-vite'
import type { IGPost } from '~/types'
import { useState } from 'react'
import { IGStoryViewer } from '~/components/ins/IGStoryViewer'
import { highlightPost, storyPost, trayPosts } from './ig.fixtures'

/**
 * IGStoryViewer —— 快拍全屏查看器。
 *
 * 遮罩为 `fixed inset-0`，故用 fullscreen 布局。切条（左右按钮 / ←→ 键）在 story 内可交互，
 * 关闭按钮为 no-op（story 里无宿主状态可回退）。
 */
const meta = {
  title: 'Instagram/StoryViewer',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** 可交互包装：让切条与选择在 Storybook 里真的生效。 */
function ViewerDemo({
  posts,
  initialIndex = 0,
  initiallySelected,
}: {
  posts: IGPost[]
  initialIndex?: number
  initiallySelected?: string[]
}) {
  const [index, setIndex] = useState(initialIndex)
  const [selection, setSelection] = useState<Set<string>>(() => new Set(initiallySelected ?? []))

  const toggle = (id: string) => {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id))
        next.delete(id)
      else
        next.add(id)
      return next
    })
  }

  return (
    <IGStoryViewer
      posts={posts}
      index={index}
      onIndexChange={setIndex}
      open
      onClose={() => undefined}
      selected={selection}
      onToggle={toggle}
      onDownload={() => undefined}
    />
  )
}

export const Photo: Story = {
  render: () => <ViewerDemo posts={[storyPost, ...trayPosts]} />,
}

export const Video: Story = {
  render: () => <ViewerDemo posts={[storyPost, ...trayPosts]} initialIndex={2} />,
}

export const HighlightWithMeta: Story = {
  render: () => <ViewerDemo posts={[highlightPost, ...trayPosts]} />,
}

export const Selected: Story = {
  render: () => (
    <ViewerDemo posts={[storyPost, ...trayPosts]} initiallySelected={[storyPost.id]} />
  ),
}

/** 单条：无左右切条按钮，序号为 1 / 1。 */
export const SingleItem: Story = {
  render: () => <ViewerDemo posts={[storyPost]} />,
}
