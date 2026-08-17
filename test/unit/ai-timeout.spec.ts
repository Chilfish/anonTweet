import { describe, expect, it } from 'vitest'
import {
  AI_TRANSLATION_TIMEOUT_MS,
  createAITranslationAbortSignal,
} from '~/lib/ai-timeout'

/**
 * AC-DECOUPLE-002 P3：超时 helper 单测。
 */
describe('ai-timeout (AC-DECOUPLE-002)', () => {
  it('default timeout is positive and bounded (1000 <= ms <= 300000)', () => {
    expect(AI_TRANSLATION_TIMEOUT_MS).toBeGreaterThanOrEqual(1000)
    expect(AI_TRANSLATION_TIMEOUT_MS).toBeLessThanOrEqual(300_000)
  })

  it('createAITranslationAbortSignal returns a non-aborted signal that can time out', () => {
    const signal = createAITranslationAbortSignal(1000)
    expect(signal.aborted).toBe(false)
    expect(typeof signal.addEventListener).toBe('function')
    expect(signal.reason).toBeUndefined()
  })

  it('signal aborts after the configured timeout', async () => {
    const signal = createAITranslationAbortSignal(10)
    await new Promise((resolve) => {
      signal.addEventListener('abort', resolve)
    })
    expect(signal.aborted).toBe(true)
  })
})
