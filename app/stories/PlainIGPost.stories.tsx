import type { Meta, StoryObj } from '@storybook/react-vite'
import { PlainIGPost } from '~/components/ins/PlainIGPost'
import { postWithTranslation, reelPost } from './ig.fixtures'

/**
 * PlainIGPost —— 截图导出专用纯净版帖卡（结构对齐 InstagramPostCard）。
 * 场景：带翻译的图文帖 / 带音乐与媒体的 Reel。
 */
const meta = {
  title: 'Instagram/PlainPost',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const WithTranslation: Story = {
  render: () => <PlainIGPost post={postWithTranslation} />,
}

export const Reel: Story = {
  render: () => <PlainIGPost post={reelPost} />,
}
