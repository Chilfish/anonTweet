import type { RawTweet, TweetArticle } from '~/types'
import { serializeArticleBlock } from '~/lib/article/serialize'
import { mapArticle } from '~/lib/react-tweet/utils/article'
import mvernalFixture from '../../test/fixtures/articles/2099885132379500562.json'
import boldRangeFixture from '../../test/fixtures/articles/2103463356913098908.json'
import trq212Fixture from '../../test/fixtures/articles/2103576349499855160.json'
// 复用 test/ 下已冻结的真实上游 fixture（与 AC-TWEET-014/019 同源）
import bandDreamFixture from '../../test/fixtures/articles/2104058634452005231.json'
import embedRichFixture from '../../test/fixtures/articles/2104076282107723935.json'

/**
 * app/stories/article.fixtures.ts —— article 组件 story 共享数据
 *
 * 直接复用 `test/fixtures/articles/*.json`（真实上游抓取），经与线上同一套
 * `mapArticle` 映射成 `TweetArticle`，避免 story 与 AC 断言各写一份数据。
 */

function toArticle(fixture: unknown): TweetArticle {
  const article = mapArticle({ article: fixture } as unknown as RawTweet)
  if (!article)
    throw new Error('article fixture did not map to a TweetArticle')
  return article
}

/** header / 图片 / 列表 / 段落（Claude effort 一文，含封面） */
export const articleRich = toArticle(trq212Fixture)
/** MARKDOWN 实体（GFM 表格）+ LINK 实体 + mention span（Moats 一文） */
export const articleMarkdown = toArticle(mvernalFixture)
/** 只覆盖段首的 Bold 区间（行内样式切分回归样例） */
export const articleBold = toArticle(boldRangeFixture)
/** 4 个 TWEET 实体（内嵌推文渲染样例） */
export const articleManyEmbeds = toArticle(embedRichFixture)
/** 纯段落 + hashtag span（日文公告，无块文档外的富文本） */
export const articlePlain = toArticle(bandDreamFixture)

/**
 * 演示用逐块译文：直接用线上同一套 `serializeArticleBlock` 序列化后再加前缀，
 * 因此 link/mention/hashtag 的 `<<__LINK_n__>>` 占位符会被完整保留，三态 story
 * 能看到真实的占位符还原效果。
 */
export function demoTranslations(article: TweetArticle): { title?: string, blocks: Record<string, string> } {
  const blocks: Record<string, string> = {}
  for (const block of article.blocks ?? []) {
    if (block.type === 'paragraph' || block.type === 'heading' || block.type === 'list-item' || block.type === 'quote') {
      const { text } = serializeArticleBlock(block)
      if (text.trim())
        blocks[block.key] = `【译文】${text}`
    }
  }
  return {
    title: article.title ? `【译文】${article.title}` : undefined,
    blocks,
  }
}
