import { AISDKError, APICallError } from '@ai-sdk/provider'
import { NoObjectGeneratedError } from 'ai'
import { describe, expect, it } from 'vitest'
import { normalizeAIError } from '~/lib/ai-error'

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
