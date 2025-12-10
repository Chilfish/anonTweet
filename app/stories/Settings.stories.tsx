import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeparatorTemplateManager } from '~/components/translation/SeparatorTemplateManager'
import { SettingsPanel } from '~/components/translation/SettingsPanel'

const meta = {
  title: 'SettingsPanel',
  parameters: {
    layout: 'centered',
  },

} satisfies Meta<typeof SettingsPanel>

export default meta

type Story = StoryObj<typeof meta>

export const Main: Story = {
  render: () => <SettingsPanel />,
}

export const SeparatorTemplate: Story = {
  render: () => <SeparatorTemplateManager />,
}
