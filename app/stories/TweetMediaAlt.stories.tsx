import type { Meta, StoryObj } from '@storybook/react-vite'
import { TweetMediaAlt } from '~/components/tweet/TweetMediaAlt'
import { seedTranslation, WithStoreState } from './story.store'
import { tweetWithPhotos, tweetWithPhotosNoAlt } from './tweet.fixtures'

/**
 * TweetMediaAlt —— 图片描述区（Alt 文本 + 可选翻译）。
 * 场景矩阵：原文 / 译文 / 双语 / 无 Alt 空态。
 */
const meta = {
  title: 'Tweet/MediaAlt',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-[520px] bg-card p-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

function seedMode(mode: 'original' | 'translation' | 'bilingual') {
  return () =>
    seedTranslation({
      translationMode: mode,
      translationVisibility: { [tweetWithPhotos.id_str]: { body: true, alt: true } },
    })
}

export const OriginalAlt: Story = {
  render: () => (
    <WithStoreState seed={seedMode('original')}>
      <TweetMediaAlt tweet={tweetWithPhotos} />
    </WithStoreState>
  ),
}

export const TranslatedAlt: Story = {
  render: () => (
    <WithStoreState seed={seedMode('translation')}>
      <TweetMediaAlt tweet={tweetWithPhotos} />
    </WithStoreState>
  ),
}

export const BilingualAlt: Story = {
  render: () => (
    <WithStoreState seed={seedMode('bilingual')}>
      <TweetMediaAlt tweet={tweetWithPhotos} />
    </WithStoreState>
  ),
}

/** 有图但无 Alt 文本 → 组件不渲染（空态） */
export const NoAltText: Story = {
  render: () => (
    <WithStoreState seed={seedMode('original')}>
      <TweetMediaAlt tweet={tweetWithPhotosNoAlt} />
    </WithStoreState>
  ),
}
