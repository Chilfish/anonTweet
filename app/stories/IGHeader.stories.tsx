import type { Meta, StoryObj } from '@storybook/react-vite'
import { IGHeader } from '~/components/ins/IGHeader'
import { makePost } from './ig.fixtures'

/**
 * IGHeader —— IG 页面顶栏（返回 + 翻译模式 + 截图 + 更多菜单）。
 * Router 上下文由 preview.tsx 全局提供（BackButton 用 Link）。
 * 子组件（IGTranslateToggle/IGScreenshotButton/IGOptionsMenu）见
 * IGHeaderActions.stories.tsx。
 */
const meta = {
  title: 'Instagram/Header',
  component: IGHeader,
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-[700px] bg-background p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IGHeader>

export default meta

type Story = StoryObj<typeof meta>

const actions = {
  onTranslationModeChange: () => {},
  onScreenshot: () => {},
  onDownload: () => {},
  onCopyText: () => {},
  onCopyMarkdown: () => {},
}

export const WithPost: Story = {
  args: {
    post: makePost(),
    translationMode: 'bilingual',
    isCapturing: false,
    ...actions,
  },
}

export const NoPost: Story = {
  args: {
    post: null,
    translationMode: 'original',
    isCapturing: false,
    ...actions,
  },
}

export const Capturing: Story = {
  args: {
    post: makePost(),
    translationMode: 'original',
    isCapturing: true,
    ...actions,
  },
}
