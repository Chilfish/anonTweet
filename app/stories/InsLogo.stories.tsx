import type { Meta, StoryObj } from '@storybook/react-vite'
import InsLogo from '~/components/ins/InsLogo'

/**
 * InsLogo —— Instagram 手写体艺术字 Logo（SVG，className 控制尺寸）。
 */
const meta = {
  title: 'Instagram/InsLogo',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="bg-white p-6">
      <InsLogo className="h-14 w-auto" />
    </div>
  ),
}

export const SmallDark: Story = {
  render: () => (
    <div className="bg-white p-6">
      <InsLogo className="h-7 w-auto text-neutral-800" />
    </div>
  ),
}
