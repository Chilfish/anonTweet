import type { Meta, StoryObj } from '@storybook/react-vite'
import { SeparatorTemplateManager } from '~/components/settings/SeparatorTemplateManager'
import { SettingsBody, SettingsPanel } from '~/components/settings/SettingsPanel'
import { ThemeSwitcher } from '~/components/settings/ThemeSwitcher'

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

export const Body: Story = {
  render: () => <SettingsBody />,
}

export const ThemeSwitcher_: Story = {
  render: () => <ThemeSwitcher />,
}

export const SeparatorTemplate: Story = {
  render: () => <SeparatorTemplateManager />,
}
