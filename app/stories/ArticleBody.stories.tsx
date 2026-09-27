import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ArticleRun } from '~/types'
import {
  ArticleBody,
  ArticleEmbeddedTweet,
  ArticleEmbedTweet,
  ArticleImage,
  ArticleMarkdown,
  ArticleRuns,
} from '~/components/article'
import { ArticleTranslatedText } from '~/components/article/ArticleTranslatedText'
import {
  articleBold,
  articleManyEmbeds,
  articleMarkdown,
  articlePlain,
  articleRich,
  demoTranslations,
} from './article.fixtures'
import { tweetEnglish } from './tweet.fixtures'

/**
 * article 块文档渲染 story：ArticleBody（+ 三态/内嵌推文注入）与块级子组件。
 * 数据全部复用于 test/fixtures/articles（真实上游），与 AC-TWEET-016/018/019 同源。
 */
const meta = {
  title: 'Article/Body',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-[640px] rounded-2xl border border-border/60 bg-card p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const RichDocument: Story = {
  render: () => <ArticleBody blocks={articleRich.blocks ?? []} />,
}

export const MarkdownTable: Story = {
  render: () => <ArticleBody blocks={articleMarkdown.blocks ?? []} />,
}

/** 只覆盖段首的 Bold 不应扩散到整段（AC-TWEET-014 回归样例） */
export const BoldRanges: Story = {
  render: () => <ArticleBody blocks={articleBold.blocks ?? []} />,
}

export const PlainParagraphs: Story = {
  render: () => <ArticleBody blocks={articlePlain.blocks ?? []} />,
}

const markdownTranslations = demoTranslations(articleMarkdown)

export const Translated: Story = {
  render: () => (
    <ArticleBody
      blocks={articleMarkdown.blocks ?? []}
      translations={markdownTranslations.blocks}
      mode="translation"
    />
  ),
}

export const Bilingual: Story = {
  render: () => (
    <ArticleBody
      blocks={articleMarkdown.blocks ?? []}
      translations={markdownTranslations.blocks}
      mode="bilingual"
    />
  ),
}

/** 阅读页注入真实推文组件渲染内嵌帖（AC-TWEET-019） */
export const EmbeddedTweet: Story = {
  render: () => (
    <ArticleBody
      blocks={articleManyEmbeds.blocks ?? []}
      renderEmbed={() => <ArticleEmbeddedTweet tweet={tweetEnglish} />}
    />
  ),
}

/** 取数失败/离线：回退轻量链接卡 */
export const EmbedFallback: Story = {
  render: () => <ArticleBody blocks={articleManyEmbeds.blocks ?? []} />,
}

const inlineRuns: ArticleRun[] = [
  { type: 'text', text: '粗体 ', styles: ['bold'] },
  { type: 'link', text: '链接', url: 'https://example.com/post' },
  { type: 'text', text: ' 与 ' },
  { type: 'mention', text: '@chilfish', href: 'https://x.com/chilfish' },
  { type: 'text', text: ' · ' },
  { type: 'text', text: '斜体', styles: ['italic'] },
]

export const InlineRuns: Story = {
  render: () => (
    <p className="text-[15px] leading-7 text-foreground/90">
      <ArticleRuns runs={inlineRuns} />
    </p>
  ),
}

/** 译文里的 `<<__LINK_n__>>` 按原 run 顺序还原为可点击元素（AC-TWEET-018） */
export const TranslatedRuns: Story = {
  render: () => (
    <p className="text-[15px] leading-7 text-foreground/90">
      <ArticleTranslatedText translation="译文：<<__LINK_0__>> 与 <<__LINK_1__>> 结束" runs={inlineRuns} />
    </p>
  ),
}

export const MarkdownOnly: Story = {
  render: () => (
    <ArticleMarkdown text={'## 小标题\n\n| 名称 | 年份 |\n| --- | --- |\n| Example | 2026 |\n\n- 一\n- 二\n'} />
  ),
}

export const ImageBlock: Story = {
  render: () => (
    <ArticleImage
      media={{ id: 'demo', url: 'https://picsum.photos/seed/article/1200/800', width: 1200, height: 800 }}
      caption="示例图注（caption 可选）"
    />
  ),
}

export const LinkCardOnly: Story = {
  render: () => <ArticleEmbedTweet tweetId="2103032879496540640" />,
}
