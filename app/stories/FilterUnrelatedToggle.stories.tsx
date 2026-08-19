import type { Meta, StoryObj } from '@storybook/react-vite'
import { FilterUnrelatedToggle } from '~/components/tweet/FilterUnrelatedToggle'
import { useTranslationStore } from '~/lib/stores/translation'
import { seedTranslation, WithStoreState } from './story.store'

/**
 * FilterUnrelatedToggle —— 「仅相关性/全部评论」筛选开关。
 * 只有加载出评论（commentIds > 0）才显示；未加载时组件为空态。
 */
const meta = {
  title: 'Tweet/FilterToggle',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="flex h-24 w-[520px] items-center bg-background p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

function seedWithComments() {
  return seedTranslation({ commentIds: ['9000000000000000201', '9000000000000000202'] })
}

function seedWithCommentsFiltered() {
  return seedTranslation({
    commentIds: ['9000000000000000201', '9000000000000000202'],
    settings: { ...useTranslationStore.getState().settings, filterUnrelated: true },
  })
}

export const Visible: Story = {
  render: () => (
    <WithStoreState seed={seedWithComments}>
      <FilterUnrelatedToggle />
    </WithStoreState>
  ),
}

export const FilteredOn: Story = {
  render: () => (
    <WithStoreState seed={seedWithCommentsFiltered}>
      <FilterUnrelatedToggle />
    </WithStoreState>
  ),
}

export const HiddenNoComments: Story = {
  render: () => (
    <WithStoreState seed={() => seedTranslation({ commentIds: [] })}>
      <FilterUnrelatedToggle />
    </WithStoreState>
  ),
}
