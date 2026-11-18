import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { FloatingDock } from '~/components/layout/FloatingDock'

/** 全站悬浮导航：移动端贴底，下滑收起。 */
const meta = {
  title: 'Layout/FloatingDock',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <MemoryRouter initialEntries={['/']}>
      <div className="h-screen bg-background" />
      <FloatingDock />
    </MemoryRouter>
  ),
}
