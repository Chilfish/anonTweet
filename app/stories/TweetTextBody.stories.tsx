import type { Meta, StoryObj } from '@storybook/react-vite'
import { TweetTextBody } from '~/components/tweet/TweetTextBody'
import { seedTranslation, WithStoreState } from './story.store'
import { tweetEnglish, tweetWithCard } from './tweet.fixtures'

/**
 * TweetTextBody —— 原文 + 翻译显示（TranslationDisplay）双段结构。
 * 场景矩阵：原文模式（默认）/ 翻译模式 / 双语模式 / 手动翻译覆盖 / 日文带链接实体。
 * 渲染上下文尽量贴近实际推文卡片（TweetNode 内宽度）。
 */
const meta = {
  title: 'Tweet/TextBody',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-[520px] bg-card p-3 text-[15px]">
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
      translationVisibility: { [tweetEnglish.id_str]: { body: true, alt: true } },
    })
}

export const OriginalOnly: Story = {
  render: () => (
    <WithStoreState seed={seedMode('original')}>
      <TweetTextBody tweet={tweetEnglish} />
    </WithStoreState>
  ),
}

export const Translated: Story = {
  render: () => (
    <WithStoreState seed={seedMode('translation')}>
      <TweetTextBody tweet={tweetEnglish} />
    </WithStoreState>
  ),
}

export const Bilingual: Story = {
  render: () => (
    <WithStoreState seed={seedMode('bilingual')}>
      <TweetTextBody tweet={tweetEnglish} />
    </WithStoreState>
  ),
}

/** 手动翻译（translation 字段）覆盖 AI 翻译：resolveTranslationView 决策链 manual > ai */
export const ManualTranslation: Story = {
  render: () => (
    <WithStoreState seed={() => {
      seedTranslation({
        translationMode: 'bilingual',
        translationVisibility: { [tweetEnglish.id_str]: { body: true, alt: true } },
        translations: {
          [tweetEnglish.id_str]: [{
            type: 'text',
            text: 'Just shipped the new design 🚀 The team worked hard on this one — check it out and let us know what you think!',
            index: 0,
            translation: '手动翻译：刚发布了新设计（人工校订版）🚀',
          }],
        },
      })
    }}
    >
      <TweetTextBody tweet={tweetEnglish} />
    </WithStoreState>
  ),
}

/** 日语原文 + 链接实体（带 card 的推文正文） */
export const JapaneseWithEntities: Story = {
  render: () => (
    <WithStoreState seed={seedMode('original')}>
      <TweetTextBody tweet={tweetWithCard} />
    </WithStoreState>
  ),
}
