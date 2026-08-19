import type { Meta, StoryObj } from '@storybook/react-vite'
import { TweetOptionsMenu } from '~/components/tweet/TweetOptionsMenu'

/**
 * TweetOptionsMenu —— 更多选项菜单（设置 / 下载 / 复制 / 布局 / 翻译按钮显隐）。
 * Dropdown 触发按钮 + 菜单内容；打开态交互可在 Storybook addon 面板操作。
 */
const meta = {
  title: 'Tweet/OptionsMenu',
  component: TweetOptionsMenu,
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="flex h-40 w-[520px] items-start justify-end bg-background p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TweetOptionsMenu>

export default meta

type Story = StoryObj<typeof meta>

export const Enabled: Story = {
  args: { disableActions: false },
}

export const ActionsDisabled: Story = {
  args: { disableActions: true },
}
