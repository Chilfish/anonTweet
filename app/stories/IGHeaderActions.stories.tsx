import type { Meta, StoryObj } from '@storybook/react-vite'
import { IGOptionsMenu } from '~/components/ins/IGOptionsMenu'
import { IGScreenshotButton } from '~/components/ins/IGScreenshotButton'
import { IGTranslateToggle } from '~/components/ins/IGTranslateToggle'

/**
 * IGHeader 子组件：翻译模式切换 / 截图按钮 / 更多菜单（IGHeader.stories.tsx 的组成件）。
 */
const meta = {
  title: 'Instagram/HeaderActions',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="flex h-32 w-[468px] items-center justify-end gap-2 bg-background p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const TranslateOriginal: Story = {
  render: () => <IGTranslateToggle mode="original" onModeChange={() => {}} />,
}

export const TranslateBilingual: Story = {
  render: () => <IGTranslateToggle mode="bilingual" onModeChange={() => {}} />,
}

export const TranslateDisabled: Story = {
  render: () => <IGTranslateToggle mode="original" onModeChange={() => {}} disabled />,
}

export const ScreenshotIdle: Story = {
  render: () => <IGScreenshotButton isCapturing={false} onScreenshot={() => {}} />,
}

export const ScreenshotCapturing: Story = {
  render: () => <IGScreenshotButton isCapturing onScreenshot={() => {}} />,
}

export const OptionsEnabled: Story = {
  render: () => (
    <IGOptionsMenu
      disableActions={false}
      onDownload={() => {}}
      onCopyText={() => {}}
      onCopyMarkdown={() => {}}
    />
  ),
}

export const OptionsDisabled: Story = {
  render: () => (
    <IGOptionsMenu
      disableActions
      onDownload={() => {}}
      onCopyText={() => {}}
      onCopyMarkdown={() => {}}
    />
  ),
}
