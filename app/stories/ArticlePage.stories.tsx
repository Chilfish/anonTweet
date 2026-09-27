import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ArticleViewMode } from '~/components/article'
import { useRef, useState } from 'react'
import { ArticleReader, ArticleToolbar } from '~/components/article'
import { articleRich, demoTranslations } from './article.fixtures'
import { tweetEnglish } from './tweet.fixtures'

/**
 * 阅读页全形态组合：ArticleToolbar + ArticleReader，三态开关可交互
 * （原文 / 双语 / 仅译文），贴近 `/article/:id` 的真实布局（无数据取数）。
 */
const meta = {
  title: 'Article/Page',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const translations = demoTranslations(articleRich)

function ArticlePageDemo({ initialMode = 'original' }: { initialMode?: ArticleViewMode }) {
  const [mode, setMode] = useState<ArticleViewMode>(initialMode)
  const captureRef = useRef<HTMLDivElement>(null)

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <ArticleToolbar
        tweetId={tweetEnglish.id_str}
        article={articleRich}
        tweet={tweetEnglish}
        captureRef={captureRef}
        mode={mode}
        onModeChange={setMode}
        status="done"
        hasTranslation
        onRetry={() => {}}
      />
      <ArticleReader
        tweet={tweetEnglish}
        article={articleRich}
        mode={mode}
        translations={translations.blocks}
        translatedTitle={translations.title}
        captureRef={captureRef}
      />
    </div>
  )
}

export const Interactive: Story = {
  render: () => <ArticlePageDemo />,
}

export const PageBilingual: Story = {
  render: () => <ArticlePageDemo initialMode="bilingual" />,
}

export const PageTranslationOnly: Story = {
  render: () => <ArticlePageDemo initialMode="translation" />,
}
