import type { Meta, StoryObj } from '@storybook/react-vite'
import { IGCaption } from '~/components/ins/IGCaption'
import { postWithTranslation } from './ig.fixtures'

/**
 * IGCaption —— IG caption 原文 + 翻译分隔符 + 译文（app/components/ins/IGCaption.tsx）。
 * 场景：原文 / 双语 / 仅译文 / 空文本。
 */
const meta = {
  title: 'Instagram/Caption',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-[468px] bg-card">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Original: Story = {
  render: () => <IGCaption username="chilfish" text={postWithTranslation.description} />,
}

export const Bilingual: Story = {
  render: () => (
    <IGCaption
      username="chilfish"
      text={postWithTranslation.description}
      translatedText={postWithTranslation.captionTranslation}
    />
  ),
}

export const TranslatedOnly: Story = {
  render: () => (
    <IGCaption
      username="chilfish"
      text={postWithTranslation.description}
      translatedText={postWithTranslation.captionTranslation}
      translationMode="translation"
    />
  ),
}

export const EmptyText: Story = {
  render: () => <IGCaption username="chilfish" text="" />,
}
