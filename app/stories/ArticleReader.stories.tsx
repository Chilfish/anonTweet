import type { Meta, StoryObj } from '@storybook/react-vite'
import type { TweetArticle } from '~/types'
import { ArticleEmbeddedTweet, ArticleReader } from '~/components/article'
import { derivePlainText } from '~/lib/article/parse'
import {
  articleManyEmbeds,
  articleMarkdown,
  articlePlain,
  articleRich,
  demoTranslations,
} from './article.fixtures'
import { tweetEnglish } from './tweet.fixtures'

/**
 * ArticleReader —— 文章「全文」卡片的各形态：
 * rich（标题/图片/列表）、markdown（GFM 表格）、plain 兜底、封面有无、附言有无、
 * 内嵌推文（真实/回退）、三态译文（原文 / 双语 / 仅译文）。
 * 数据复用 test/fixtures/articles（与 AC 同源）。
 */
const meta = {
  title: 'Article/Reader',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-[672px] px-4 py-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** 文章型推文本身只有一条文章链接 → 不渲染附言 */
const articleOnlyTweet = {
  ...tweetEnglish,
  text: 'https://t.co/artcl',
  entities: [{
    type: 'url',
    index: 0,
    text: 'https://t.co/artcl',
    display_url: 'x.com/i/article/…',
    url: 'https://t.co/artcl',
    expanded_url: 'https://x.com/i/article/2103576349499855160',
    href: 'https://x.com/i/article/2103576349499855160',
  }] as typeof tweetEnglish.entities,
}

const richTranslations = demoTranslations(articleRich)
const markdownTranslations = demoTranslations(articleMarkdown)

/** 无块文档的兜底形态：仅 plainText（内容由 blocks 派生，保持与线上一致） */
const plainOnlyArticle: TweetArticle = {
  ...articlePlain,
  format: 'plain',
  plainText: derivePlainText(articlePlain.blocks ?? []),
  blocks: undefined,
}

export const RichDocument: Story = {
  render: () => <ArticleReader tweet={articleOnlyTweet} article={articleRich} />,
}

/** 带作者附言的形态（推文正文非仅链接） */
export const WithCommentary: Story = {
  render: () => <ArticleReader tweet={tweetEnglish} article={articleRich} />,
}

export const MarkdownTable: Story = {
  render: () => <ArticleReader tweet={articleOnlyTweet} article={articleMarkdown} />,
}

/** 无块文档 → plainText 兜底 */
export const PlainFallback: Story = {
  render: () => <ArticleReader tweet={articleOnlyTweet} article={plainOnlyArticle} />,
}

export const WithoutCover: Story = {
  render: () => <ArticleReader tweet={articleOnlyTweet} article={{ ...articleRich, coverImage: undefined }} />,
}

export const Bilingual: Story = {
  render: () => (
    <ArticleReader
      tweet={articleOnlyTweet}
      article={articleRich}
      translations={richTranslations.blocks}
      translatedTitle={richTranslations.title}
      mode="bilingual"
    />
  ),
}

export const TranslationOnly: Story = {
  render: () => (
    <ArticleReader
      tweet={articleOnlyTweet}
      article={articleMarkdown}
      translations={markdownTranslations.blocks}
      translatedTitle={markdownTranslations.title}
      mode="translation"
    />
  ),
}

/** 内嵌推文：注入真实推文组件（AC-TWEET-019） */
export const WithEmbeddedTweets: Story = {
  render: () => (
    <ArticleReader
      tweet={articleOnlyTweet}
      article={articleManyEmbeds}
      renderEmbed={() => <ArticleEmbeddedTweet tweet={tweetEnglish} />}
    />
  ),
}

/** 内嵌推文取数失败 → 回退链接卡 */
export const EmbedFallback: Story = {
  render: () => <ArticleReader tweet={articleOnlyTweet} article={articleManyEmbeds} />,
}
