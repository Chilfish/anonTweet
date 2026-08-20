import type { Meta, StoryObj } from '@storybook/react-vite'
import type { EnrichedTweet } from '~/types'
import { useEffect } from 'react'
import { AIVisionEditorDialog } from '~/components/translation/AIVisionEditorDialog'
import { AltTranslationEditor } from '~/components/translation/AltTranslationEditor'
import { TranslationDisplay } from '~/components/translation/TranslationDisplay'
import { TranslationEditor } from '~/components/translation/TranslationEditor'
import { useVisionLogic } from '~/hooks/use-vision-logic'
import { seedTranslation, WithStoreState } from './story.store'
import { tweetEnglish, tweetWithPhotos, tweetWithVisionDone } from './tweet.fixtures'

/**
 * translation 编辑器/显示组件 story（review 阶段二 item 3）：
 * TranslationDisplay / TranslationEditor / AltTranslationEditor / AIVisionEditorDialog（打开态）。
 */
const meta = {
  title: 'Translation/Editors',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-[560px] bg-card p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Display: Story = {
  render: () => (
    <WithStoreState
      seed={() => seedTranslation({
        translationMode: 'bilingual',
        translationVisibility: { [tweetEnglish.id_str]: { body: true, alt: true } },
      })}
    >
      <TranslationDisplay tweetId={tweetEnglish.id_str} originalTweet={tweetEnglish} />
    </WithStoreState>
  ),
}

export const EditorButton: Story = {
  render: () => (
    <div className="flex justify-end">
      <TranslationEditor originalTweet={tweetEnglish} />
    </div>
  ),
}

export const AltEditorButton: Story = {
  render: () => (
    <div className="flex justify-end">
      <AltTranslationEditor originalTweet={tweetWithPhotos} />
    </div>
  ),
}

/** AIVisionEditorDialog 打开态：挂载即调用 initializeEditor 展开弹窗（含逐图草稿） */
export const VisionDialogOpen: Story = {
  render: () => <VisionDialogOpened tweet={tweetWithVisionDone} />,
}

function VisionDialogOpened({ tweet }: { tweet: EnrichedTweet }) {
  const editor = useVisionLogic(tweet)
  // 挂载时打开弹窗一次，展示编辑态视觉
  useEffect(() => {
    editor.initializeEditor()
  }, [editor])

  return <AIVisionEditorDialog editor={editor} />
}
