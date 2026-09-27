import { AISDKError, APICallError } from '@ai-sdk/provider'
import { NoObjectGeneratedError } from 'ai'

/**
 * 结构化的 AI 传输错误，随 BFF 响应返回给前端。
 * 前端据此在 toast 里结构化展示「为什么连不上」。
 */
export interface AITransportError {
  /** 错误类别，如 APICallError / NoSuchModelError / Error */
  type: string
  message: string
  /** 实际请求的完整端点 URL */
  url?: string
  statusCode?: number
  /** 服务端返回的原始响应体（可能较长，前端会截断展示） */
  responseBody?: string
  isRetryable?: boolean
  /** 从 responseBody 中解析出的服务端错误信息（如 "Invalid API key."） */
  providerMessage?: string
  /**
   * 结构化输出未能解析时模型实际生成的文本（AI_NoObjectGeneratedError）。
   * 截断保留，用于定位「模型吐了什么」。
   */
  generatedText?: string
  /** 模型结束原因（length 表示被 max_tokens 截断，stop 表示正常结束） */
  finishReason?: string
}

/** 保留的模型原始输出上限，避免把整段响应塞进错误对象 */
const GENERATED_TEXT_LIMIT = 2000

function extractProviderMessage(responseBody: string | undefined): string | undefined {
  if (!responseBody)
    return undefined
  try {
    const parsed = JSON.parse(responseBody) as { error?: { message?: string } | string }
    if (typeof parsed.error === 'string')
      return parsed.error
    if (parsed.error && typeof parsed.error.message === 'string')
      return parsed.error.message
  }
  catch {
    return undefined
  }
  return undefined
}

/**
 * 把 AI SDK 抛出的错误规整为可序列化的结构化对象。
 * 服务端 BFF 路由在 catch 中调用，附带在 JSON 响应里返回前端。
 */
export function normalizeAIError(error: unknown): AITransportError {
  if (APICallError.isInstance(error)) {
    return {
      type: 'APICallError',
      message: error.message,
      url: error.url,
      statusCode: error.statusCode,
      responseBody: error.responseBody,
      isRetryable: error.isRetryable,
      providerMessage: extractProviderMessage(error.responseBody),
    }
  }
  if (NoObjectGeneratedError.isInstance(error)) {
    return {
      type: 'NoObjectGeneratedError',
      message: error.message,
      // 旧版只回 { type, message }，把模型原文/结束原因全丢了，
      // 线上只能看到一句泛化报错、无法定位（AC-TWEET-020）。
      generatedText: error.text ? error.text.slice(0, GENERATED_TEXT_LIMIT) : undefined,
      finishReason: error.finishReason,
    }
  }
  if (AISDKError.isInstance(error)) {
    return { type: error.name, message: error.message }
  }
  if (error instanceof Error) {
    return { type: 'Error', message: error.message }
  }
  return { type: 'UnknownError', message: String(error) }
}
