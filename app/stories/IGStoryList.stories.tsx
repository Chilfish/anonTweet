import type { Meta, StoryObj } from '@storybook/react-vite'
import { IGStoryList } from '~/components/ins/IGStoryList'
import { storyPost, trayPosts, trayPostsMany } from './ig.fixtures'

/**
 * IGStoryList —— 快拍 / 精选集列表（相册网格，下载优先）。
 *
 * 场景：tray 少量 / 精选集（标题）/ 32 条稠密 / 单条（自然比例单卡）。
 * 下载动作依赖浏览器下载 API，story 里仅作视觉核对（点击会走真实 downloadFiles）。
 */
const meta = {
  title: 'Instagram/StoryList',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const StoriesTray: Story = {
  render: () => (
    <div className="w-[720px]">
      <IGStoryList posts={trayPosts} />
    </div>
  ),
}

export const HighlightReel: Story = {
  render: () => (
    <div className="w-[720px]">
      <IGStoryList
        posts={[
          trayPosts[0]!,
          { ...trayPosts[1]!, type: 'highlight', highlight_title: '佐世保遠征' },
        ]}
      />
    </div>
  ),
}

/** 几十条快拍的扫视场景：网格而非一屏一条的竖排卡片。 */
export const DenseTray: Story = {
  render: () => (
    <div className="w-[720px]">
      <IGStoryList posts={trayPostsMany} />
    </div>
  ),
}

/** 单条：保留自然比例单卡，工具栏只留「全部下载」。 */
export const SingleStory: Story = {
  render: () => (
    <div className="w-[520px]">
      <IGStoryList posts={[storyPost]} />
    </div>
  ),
}
