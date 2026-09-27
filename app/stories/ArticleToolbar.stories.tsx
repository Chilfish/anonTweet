import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ArticleTranslationStatus } from '~/lib/stores/translation'
import { useRef } from 'react'
import { ArticleOptionsMenu, ArticleToolbar, ArticleTranslateToggle } from '~/components/article'
import { articleMarkdown } from './article.fixtures'
import { tweetEnglish } from './tweet.fixtures'

/**
 * article 阅读页工具栏 story：ArticleToolbar（返回 / 三态 / 重试 / 一键截图 + 更多菜单）
 * 与拆出的 ArticleTranslateToggle / ArticleOptionsMenu。Router 上下文由全局 preview 提供。
 */
const meta = {
  title: 'Article/Toolbar',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-[720px] bg-background p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

function ToolbarDemo({ status = 'idle', hasTranslation = false }: {
  status?: ArticleTranslationStatus
  hasTranslation?: boolean
}) {
  const captureRef = useRef<HTMLDivElement>(null)
  return (
    <ArticleToolbar
      tweetId={tweetEnglish.id_str}
      article={articleMarkdown}
      tweet={tweetEnglish}
      captureRef={captureRef}
      mode="original"
      onModeChange={() => {}}
      status={status}
      hasTranslation={hasTranslation}
      onRetry={() => {}}
    />
  )
}

export const Original: Story = {
  render: () => <ToolbarDemo />,
}

/** 翻译中：显示 loading 指示 + 三态开关（已有译文可切） */
export const Translating: Story = {
  render: () => <ToolbarDemo status="loading" hasTranslation />,
}

/** 翻译失败：显示「重试翻译」 */
export const RetryAfterError: Story = {
  render: () => <ToolbarDemo status="error" />,
}

export const TranslateToggle: Story = {
  render: () => <ArticleTranslateToggle mode="bilingual" onModeChange={() => {}} />,
}

export const OptionsMenu: Story = {
  render: () => <ArticleOptionsMenu article={articleMarkdown} tweet={tweetEnglish} />,
}
