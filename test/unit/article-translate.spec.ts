import type { ArticleBlock, ArticleRun } from '~/types'
/**
 * test/unit/article-translate.spec.ts
 *
 * AC-TWEET-017：文章分块翻译的**离线契约**（不触网、不调 LLM）。
 * 覆盖可译块序列化 / 块内占位符按序编号 / 已是中文的块跳过 / 译文写库 intent 校验。
 * LLM 调用本身（分批 + 占位符校验重试）由 `autoTranslateArticle` 运行时承担，
 * 本用例只锁「喂给模型的输入形态」与「落库契约」这两个易回归的接缝。
 */
import { describe, expect, it } from 'vitest'
import { looksLikeChinese, serializeArticleBlock } from '~/lib/article/translate'
import { tweetSchema } from '~/lib/validations/tweet'

const paragraphWithAnchors: Extract<ArticleBlock, { runs: ArticleRun[] }> = {
  key: 'b1',
  type: 'paragraph',
  runs: [
    { type: 'text', text: 'See ' },
    { type: 'link', text: 'this', url: 'https://example.com/post' },
    { type: 'text', text: ' and ' },
    { type: 'mention', text: '@foo', href: 'https://x.com/foo' },
  ],
}

describe('AC-TWEET-017: article block translation contract', () => {
  it('AC-TWEET-017: serializes inline anchors into ordered placeholders', () => {
    const { text, placeholders } = serializeArticleBlock(paragraphWithAnchors)

    expect(text).toBe('See <<__LINK_0__>> and <<__LINK_1__>>')
    expect(placeholders).toEqual(['<<__LINK_0__>>', '<<__LINK_1__>>'])
  })

  it('AC-TWEET-017: skips text that is already Chinese (CJK, no kana)', () => {
    expect(looksLikeChinese('这是一段中文')).toBe(true)
    expect(looksLikeChinese('中文 mixed with English')).toBe(true)
    expect(looksLikeChinese('これは日本語です')).toBe(false)
    expect(looksLikeChinese('Just English')).toBe(false)
  })

  it('AC-TWEET-017: accepts the article-translation persistence intent', () => {
    const valid = tweetSchema.safeParse({
      intent: 'updateArticleTranslations',
      data: [{
        tweetId: '2103576349499855160',
        translation: { title: '标题', blocks: { b1: '译文' } },
      }],
    })
    expect(valid.success).toBe(true)

    const invalid = tweetSchema.safeParse({
      intent: 'updateArticleTranslations',
      data: [{ tweetId: '1', translation: { blocks: { b1: 123 } } }],
    })
    expect(invalid.success).toBe(false)
  })
})
