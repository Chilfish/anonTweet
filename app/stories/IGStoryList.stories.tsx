import type { Meta, StoryObj } from '@storybook/react-vite'
import { IGStoryList } from '~/components/ins/IGStoryList'
import { trayPosts } from './ig.fixtures'

/**
 * IGStoryList —— 快拍 / 精选集列表（下载优先）。
 * 场景：tray 多条（勾选 + 单条/选中/全部下载）/ 精选集（标题 + 转发来源）。
 *
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
    <div className="w-[520px]">
      <IGStoryList posts={trayPosts} />
    </div>
  ),
}

export const HighlightReel: Story = {
  render: () => (
    <div className="w-[520px]">
      <IGStoryList
        posts={[
          trayPosts[0]!,
          { ...trayPosts[1]!, type: 'highlight', highlight_title: '佐世保遠征' },
        ]}
      />
    </div>
  ),
}
