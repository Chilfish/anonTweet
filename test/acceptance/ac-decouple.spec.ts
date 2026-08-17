import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * test/acceptance/ac-decouple.spec.ts
 *
 * AC-DECOUPLE-001~002 仓库级静态检查（阶段二任务 1，review P1-2）：
 *
 * - 001：GET /api/tweet/get 不得内联 LLM 调用——翻译统一由客户端/截图 SSR
 *        经 /api/ai-translation 触发，首屏不再阻塞等待 LLM 完整返回。
 * - 002：所有服务端 AI 调用（推文 / IG caption）必须携带 AbortSignal 超时
 *        （app/lib/ai-timeout.ts，默认 120s）。
 */

const read = (rel: string) => fs.readFileSync(path.resolve(import.meta.dirname, '..', '..', rel), 'utf8')

const GET_ROUTE = 'app/routes/api/tweet/get.ts'
const TWEET_PAGE = 'app/routes/tweet.tsx'
const PLAIN_ROUTE = 'app/routes/plain.tsx'
const AUTO_TRANSLATE_HOOK = 'app/hooks/use-auto-translate.ts'
const AI_TRANSLATION_LIB = 'app/lib/AITranslation.ts'
const IG_CAPTION_LIB = 'app/lib/translateIGCaption.ts'
const TIMEOUT_HELPER = 'app/lib/ai-timeout.ts'

describe('AC-DECOUPLE-001: GET /api/tweet/get does not inline LLM calls', () => {
  it('tweet/get.ts does not import or call autoTranslateTweet', () => {
    const src = read(GET_ROUTE)
    expect(src).not.toContain('autoTranslateTweet')
    expect(src).not.toMatch(/from ['"]~\/lib\/AITranslation['"]/)
  })

  it('tweet/get.ts has no LLM call features (generateText / streamText)', () => {
    const src = read(GET_ROUTE)
    expect(src).not.toMatch(/generateText|streamText/)
  })

  it('tweet page triggers translation via /api/ai-translation (client-side)', () => {
    const page = read(TWEET_PAGE)
    const hook = read(AUTO_TRANSLATE_HOOK)
    expect(page).toContain('useAutoTranslateTweets')
    expect(hook).toContain('\'/api/ai-translation\'')
  })

  it('plain screenshot route translates via /api/ai-translation instead of GET', () => {
    const src = read(PLAIN_ROUTE)
    expect(src).toContain('/api/ai-translation')
    expect(src).not.toContain('autoTranslateTweet')
  })
})

describe('AC-DECOUPLE-002: server AI calls carry AbortSignal timeout', () => {
  it('ai-timeout helper exports positive bounded default ms and a signal factory', () => {
    const src = read(TIMEOUT_HELPER)
    expect(src).toMatch(/export const AI_TRANSLATION_TIMEOUT_MS/)
    expect(src).toMatch(/AbortSignal\.timeout/)
  })

  it('aITranslation.translateText passes abortSignal to generateText', () => {
    const src = read(AI_TRANSLATION_LIB)
    expect(src).toContain('createAITranslationAbortSignal')
    expect(src).toContain('abortSignal: createAITranslationAbortSignal()')
  })

  it('translateIGCaption passes abortSignal to every generateText call', () => {
    const src = read(IG_CAPTION_LIB)
    const abortCount = src.match(/abortSignal: createAITranslationAbortSignal\(\)/g)?.length ?? 0
    const genCount = src.match(/generateText\(/g)?.length ?? 0
    expect(genCount).toBeGreaterThanOrEqual(2)
    expect(abortCount).toBe(genCount)
  })
})
