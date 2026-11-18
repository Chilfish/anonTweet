import type { Meta, StoryObj } from '@storybook/react-vite'
import { Dateline } from '~/components/layout/Dateline'
import { HankoMark } from '~/components/layout/HankoMark'

/** 外壳装饰元素：朱印（品牌印记）与日付线（日期 + 栏目）。 */
const meta = {
  title: 'Layout/Decor',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-[420px] space-y-6 bg-background p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Hanko: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <HankoMark />
      <span className="text-sm text-muted-foreground">品牌印记（aria-hidden）</span>
    </div>
  ),
}

export const Datelines: Story = {
  render: () => (
    <div className="space-y-4">
      <Dateline label="匿名阅读" />
      <Dateline label="推文" />
      <Dateline />
    </div>
  ),
}
