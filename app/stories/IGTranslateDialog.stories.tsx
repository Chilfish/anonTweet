import type { Meta, StoryObj } from '@storybook/react-vite'
import { IGTranslateDialog } from '~/components/ins/IGTranslateDialog'
import { makePost } from './ig.fixtures'

/**
 * IGTranslateDialog —— IG caption 翻译弹窗（原对照 + AI 翻译 + 可编辑译文 + 保存）。
 * 渲染即展示触发按钮；打开弹窗为交互态（Storybook 面板点击 Languages 按钮）。
 */
const meta = {
  title: 'Instagram/TranslateDialog',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-[468px] bg-card p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Closed: Story = {
  render: () => <IGTranslateDialog post={makePost()} onTranslated={() => {}} />,
}

export const WithExistingTranslation: Story = {
  render: () => (
    <IGTranslateDialog
      post={makePost({ captionTranslation: '傍晚沿着海岸散步 🌊' })}
      onTranslated={() => {}}
    />
  ),
}
