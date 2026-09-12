import type { Meta, StoryObj } from '@storybook/react-vite'
import { IGPostList } from '~/components/ins/IGPostList'
import { postWithTranslation, reelPost } from './ig.fixtures'

/**
 * IGPostList —— 普通 post / reel 的单卡渲染（快拍列表见 Instagram/StoryList）。
 * 场景：带翻译的图文帖 / 带音乐与媒体的 Reel。
 */
const meta = {
  title: 'Instagram/PostList',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const SinglePostWithTranslation: Story = {
  render: () => (
    <div className="w-[520px]">
      <IGPostList posts={[postWithTranslation]} />
    </div>
  ),
}

export const ReelPost: Story = {
  render: () => (
    <div className="w-[520px]">
      <IGPostList posts={[reelPost]} />
    </div>
  ),
}
