import type { LanguageModelV4GenerateResult, LanguageModelV4Prompt } from '@ai-sdk/provider'
import type { EnrichedTweet } from '~/types'
/**
 * test/unit/tweet-translate.spec.ts
 *
 * AC-TWEET-021：推文实体翻译（`translateText`）的解析失败重试。
 *
 * 用 `ai/test` 的 `MockLanguageModelV4` 驱动**真实的** `generateText` + `Output.object`，
 * 复现线上 deepseek-flash 的失败形态：system prompt 曾要求把 JSON 字符串里的换行写成
 * **真实换行**，而真实换行是非法 JSON 控制字符 → `JSON.parse` 失败 → SDK 抛
 * `NoObjectGeneratedError`（`could not parse the response`）。旧实现让该异常直接冒泡，
 * 整个「2 次重试」形同虚设，路由一路 500。
 */
import { MockLanguageModelV4 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { translateText } from '~/lib/AITranslation'

const tweet = {
  id_str: '2104175771057352713',
  lang: 'ja',
  text: 'これはテストです。\n二行目',
  created_at: '2026-09-27T12:00:00.000Z',
  url: 'https://x.com/u/status/2104175771057352713',
  user: { screen_name: 'u' },
  entities: [],
} as unknown as EnrichedTweet

const BASE_ARGS = {
  tweet,
  maskedText: 'これはテストです。\n二行目',
  entityContext: 'None',
  placeholders: [] as string[],
  modelName: 'deepseek-flash',
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

/** 线上真实形态：JSON 字符串内嵌**真实换行**（不是转义序列）→ 非法 JSON */
const RAW_NEWLINE = '{"translation":"一行目\n二行目"}'
/** 合法形态：换行写成转义序列 → JSON.parse 得到含真实换行的值 */
const ESCAPED_NEWLINE = '{"translation":"第一行\\n第二行"}'

function promptText(prompt: LanguageModelV4Prompt): string {
  return prompt
    .map((message) => {
      if (typeof message.content === 'string')
        return message.content
      return message.content.map(part => (part.type === 'text' ? part.text : '')).join('')
    })
    .join('\n')
}

describe('AC-TWEET-021: tweet translation parse-failure retry', () => {
  it('AC-TWEET-021: retries once when the model emits invalid JSON, then succeeds', async () => {
    const model = new MockLanguageModelV4({
      doGenerate: [modelOutput(RAW_NEWLINE), modelOutput(ESCAPED_NEWLINE)],
    })

    const result = await translateText({ ...BASE_ARGS, model })

    // 第一次解析失败被重试，而不是把整条翻译打断
    expect(model.doGenerateCalls).toHaveLength(2)
    // 转义序列由 normalizeNewlineEscapes 还原为真实换行
    expect(result.translatedText).toBe('第一行\n第二行')
  })

  it('AC-TWEET-021: rejects with the parse error when every attempt is unparseable', async () => {
    const model = new MockLanguageModelV4({ doGenerate: modelOutput(RAW_NEWLINE) })

    await expect(translateText({ ...BASE_ARGS, model })).rejects.toThrow('could not parse')
    // 两次尝试都真的发出去了，不是第一次失败就放弃
    expect(model.doGenerateCalls).toHaveLength(2)
  })

  it('AC-TWEET-021: system prompt and retry feedback demand escaped \\n, never a literal newline', async () => {
    const model = new MockLanguageModelV4({
      doGenerate: [modelOutput(RAW_NEWLINE), modelOutput(ESCAPED_NEWLINE)],
    })

    await translateText({ ...BASE_ARGS, model })

    const system = promptText(model.doGenerateCalls[0]!.prompt)
    expect(system).toContain('escape sequence \\n')
    expect(system).not.toContain('output real newline characters')

    // 解析失败后的重试消息同样重申「换行必须转义」，否则模型会一直吐非法 JSON
    const retry = promptText(model.doGenerateCalls[1]!.prompt)
    expect(retry).toContain('转义序列')
  })
})
