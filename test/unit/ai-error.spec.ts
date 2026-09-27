import { AISDKError, APICallError } from '@ai-sdk/provider'
import { NoObjectGeneratedError } from 'ai'
import { describe, expect, it, vi } from 'vitest'
import { buildAIFailure, normalizeAIError } from '~/lib/ai-error'

describe('normalizeAIError', () => {
  it('normalizes APICallError into structured transport error', () => {
    const err = new APICallError({
      message: 'Invalid API key.',
      url: 'https://opencode.ai/zen/go/v1/chat/completions',
      requestBodyValues: { model: 'deepseek-flash' },
      statusCode: 401,
      responseBody: '{"error":{"type":"AuthError","message":"Invalid API key."}}',
      isRetryable: false,
    })

    expect(normalizeAIError(err)).toEqual({
      type: 'APICallError',
      message: 'Invalid API key.',
      url: 'https://opencode.ai/zen/go/v1/chat/completions',
      statusCode: 401,
      responseBody: '{"error":{"type":"AuthError","message":"Invalid API key."}}',
      isRetryable: false,
      providerMessage: 'Invalid API key.',
    })
  })

  it('omits optional fields when APICallError lacks them', () => {
    const err = new APICallError({
      message: 'no status code',
      url: 'https://example.com/v1/chat/completions',
      requestBodyValues: {},
    })

    expect(normalizeAIError(err)).toEqual({
      type: 'APICallError',
      message: 'no status code',
      url: 'https://example.com/v1/chat/completions',
      isRetryable: false,
    })
  })

  it('keeps the raw text and finish reason for NoObjectGeneratedError', () => {
    const err = new NoObjectGeneratedError({
      message: 'No object generated: could not parse the response.',
      text: '{"blocks":{"b1":"译文一"},"b2":"译文二"}}',
      response: { id: 'r1', timestamp: new Date(0), modelId: 'deepseek-flash' },
      usage: {
        inputTokens: undefined,
        inputTokenDetails: { noCacheTokens: undefined, cacheReadTokens: undefined, cacheWriteTokens: undefined },
        outputTokens: undefined,
        outputTokenDetails: { textTokens: undefined, reasoningTokens: undefined },
        totalTokens: undefined,
      },
      finishReason: 'stop',
    })

    expect(normalizeAIError(err)).toEqual({
      type: 'NoObjectGeneratedError',
      message: 'No object generated: could not parse the response.',
      generatedText: '{"blocks":{"b1":"译文一"},"b2":"译文二"}}',
      finishReason: 'stop',
    })
  })

  it('falls back to a plain AISDKError', () => {
    const err = new AISDKError({ name: 'NoSuchModelError', message: 'no such model' })
    expect(normalizeAIError(err)).toEqual({
      type: 'NoSuchModelError',
      message: 'no such model',
    })
  })

  it('falls back to a generic Error', () => {
    expect(normalizeAIError(new Error('boom'))).toEqual({
      type: 'Error',
      message: 'boom',
    })
  })

  it('falls back to unknown for non-Error values', () => {
    expect(normalizeAIError('oops')).toEqual({ type: 'UnknownError', message: 'oops' })
    expect(normalizeAIError(undefined)).toEqual({ type: 'UnknownError', message: 'undefined' })
  })
})

describe('AC-OBS-002: AI failure payload carries the request context', () => {
  it('AC-OBS-002: buildAIFailure returns the entity id, model/provider and the body status', () => {
    const body = buildAIFailure(new Error('boom'), {
      errorCode: 'Translation failed',
      context: {
        targetType: 'article',
        targetId: '2104009234858024962',
        model: 'deepseek-flash',
        provider: 'deepseek',
      },
    })

    // HTTP 层固定 200（有意为之：业务拦截不刷 Vercel error），失败分类在 body.status
    expect(body).toEqual({
      success: false,
      error: 'Translation failed',
      status: 500,
      message: 'boom',
      targetId: '2104009234858024962',
      targetType: 'article',
      model: 'deepseek-flash',
      provider: 'deepseek',
      aiError: { type: 'Error', message: 'boom' },
    })
  })

  it('AC-OBS-002: keeps an explicit status/message override', () => {
    const body = buildAIFailure(new Error('raw reason'), {
      errorCode: 'Vision save failed',
      status: 503,
      message: '稍后重试',
      context: { targetType: 'tweet', targetId: 't1' },
    })

    expect(body.status).toBe(503)
    expect(body.message).toBe('稍后重试')
    expect(body.aiError.message).toBe('raw reason')
  })

  it('AC-OBS-002: emits an ai.fail structured log with the suffixed target id', () => {
    const lines: string[] = []
    const logSpy = vi.spyOn(console, 'log').mockImplementation((line: string) => {
      lines.push(line)
    })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      buildAIFailure(new Error('boom'), {
        errorCode: 'Translation failed',
        context: { targetType: 'tweet', targetId: '1234567890abcdef', model: 'deepseek-flash', provider: 'deepseek' },
      })
    }
    finally {
      logSpy.mockRestore()
      errorSpy.mockRestore()
    }

    const entry = lines
      .map(line => JSON.parse(line) as Record<string, unknown>)
      .find(entry => entry.event === 'ai.fail')

    expect(entry).toMatchObject({
      event: 'ai.fail',
      code: 'Translation failed',
      status: 500,
      targetType: 'tweet',
      targetId: '...7890abcdef',
      model: 'deepseek-flash',
      provider: 'deepseek',
      aiErrorType: 'Error',
      reason: 'boom',
    })
  })
})
