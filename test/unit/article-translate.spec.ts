import type { LanguageModelV4GenerateResult, LanguageModelV4Prompt } from '@ai-sdk/provider'
import type { ArticleBlock, ArticleRun, TweetArticle } from '~/types'
/**
 * test/unit/article-translate.spec.ts
 *
 * AC-TWEET-017：文章分块翻译的**离线契约**（不触网、不调 LLM）。
 * 覆盖可译块序列化 / 块内占位符按序编号 / 已是中文的块跳过 / 译文写库 intent 校验。
 *
 * AC-TWEET-020：解析失败（`AI_NoObjectGeneratedError`）的重试与降级。
 * 用 `ai/test` 的 `MockLanguageModelV4` 驱动**真实的** `generateText` + `Output.object`，
 * 复现「模型吐出非法 JSON（blocks 逐块多打 `}`）→ SDK 无法解析」的线上失败模式。
 */
import { MockLanguageModelV4 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { autoTranslateArticle, looksLikeChinese, serializeArticleBlock } from '~/lib/article/translate'
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

/** 已是中文的标题 → 标题批被跳过，第一次 generateText 就是正文批 */
const article: TweetArticle = {
  id: 'a1',
  url: 'https://x.com/i/article/a1',
  title: '标题',
  format: 'rich',
  blocks: [
    { key: 'b1', type: 'paragraph', runs: [{ type: 'text', text: 'これは一つ目の段落です。' }] },
    { key: 'b2', type: 'paragraph', runs: [{ type: 'text', text: 'これは二つ目の段落です。' }] },
  ],
}

function modelOutput(text: string): LanguageModelV4GenerateResult {
  return {
    content: [{ type: 'text', text }],
    finishReason: { unified: 'stop', raw: 'stop' },
    usage: {
      inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: 0, text: 0, reasoning: 0 },
    },
    warnings: [],
  }
}

/** 复现线上失败模式：blocks 逐块多打一个 `}`，整段 JSON 无法解析 */
const MALFORMED = '{"title":"","blocks":{"b1":"译文一"},"b2":"译文二"}}'
const VALID_FULL = '{"title":"","blocks":{"b1":"译文一","b2":"译文二"}}'
const VALID_PARTIAL = '{"title":"","blocks":{"b1":"译文一"}}'

function promptText(prompt: LanguageModelV4Prompt): string {
  return prompt
    .map((message) => {
      if (typeof message.content === 'string')
        return message.content
      return message.content.map(part => (part.type === 'text' ? part.text : '')).join('')
    })
    .join('\n')
}

function translateWith(model: MockLanguageModelV4) {
  return autoTranslateArticle(article, { modelInstance: model, modelName: 'deepseek-flash' })
}

describe('AC-TWEET-020: article translation parse-failure retry', () => {
  it('AC-TWEET-020: retries once on unparseable output instead of failing the whole article', async () => {
    const model = new MockLanguageModelV4({
      doGenerate: [modelOutput(MALFORMED), modelOutput(VALID_FULL)],
    })

    const result = await translateWith(model)

    // 第一次解析失败被重试，而不是把整篇翻译打断
    expect(model.doGenerateCalls).toHaveLength(2)
    expect(result.blocks).toEqual({ b1: '译文一', b2: '译文二' })
  })

  it('AC-TWEET-020: keeps the blocks that did validate when a batch is only partially usable', async () => {
    const model = new MockLanguageModelV4({ doGenerate: modelOutput(VALID_PARTIAL) })

    const result = await translateWith(model)

    expect(result.blocks).toEqual({ b1: '译文一' })
  })

  it('AC-TWEET-020: rejects loudly when every attempt fails, never returns an empty success', async () => {
    const model = new MockLanguageModelV4({ doGenerate: modelOutput(MALFORMED) })

    await expect(translateWith(model)).rejects.toThrow('no block could be translated')
    expect(model.doGenerateCalls).toHaveLength(2)
  })

  it('AC-TWEET-020: feeds a { key: text } object and the single-blocks contract', async () => {
    const model = new MockLanguageModelV4({ doGenerate: modelOutput(VALID_FULL) })

    await translateWith(model)

    const sent = promptText(model.doGenerateCalls[0]!.prompt)
    expect(sent).toContain('{"b1":"これは一つ目の段落です。","b2":"これは二つ目の段落です。"}')
    expect(sent).not.toContain('"key"')
    expect(sent).toContain('"blocks" is ONE object')
  })
})
