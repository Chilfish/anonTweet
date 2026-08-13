import { AISDKError, APICallError } from '@ai-sdk/provider'
import { describe, expect, it } from 'vitest'
import { normalizeAIError } from '~/lib/ai-error'

describe('normalizeAIError', () => {
  it('normalizes APICallError into structured transport error', () => {
    const err = new APICallError({
      message: 'Invalid API key.',
      url: 'https://opencode.ai/zen/go/v1/chat/completions',
      requestBodyValues: { model: 'deepseek-v4-flash' },
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
