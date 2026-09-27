import { AISDKError, APICallError } from '@ai-sdk/provider'
import { NoObjectGeneratedError } from 'ai'
import { obsLog, suffix } from '~/lib/obs-log'

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

/**
 * 失败响应的请求上下文：线上定位问题必需。
 * 早前的失败响应连实体 id 都没有（只有一句泛化 message），无法判断是哪条推文/哪篇文章挂了。
 */
export interface AIFailureContext {
  /** 请求作用的实体 id：tweetId / articleId / igPostId */
  targetId?: string
  targetType?: 'tweet' | 'article' | 'ig'
  model?: string
  provider?: string
}

/** AI 路由失败时的统一响应体 */
export interface AIFailureBody {
  success: false
  /** 机器可读的失败类别 */
  error: string
  /** 失败分类（400 输入/参数、404 目标缺失、500 网关/上游失败）；HTTP status 固定 200 */
  status: number
  message: string
  targetId?: string
  targetType?: string
  model?: string
  provider?: string
  aiError: AITransportError
}

/**
 * 构造 AI 失败的统一响应体并落一条结构化日志。
 *
 * 有意为之的约定（勿改成真实 4xx/5xx）：这些 BFF 端点**始终返回 HTTP 200**，
 * 失败与否、失败类别由 body 的 `success` + `status` + `error` 表达。
 * 否则业务逻辑拦截（无效输入、缺 key、baseUrl 不在白名单等）会在 Vercel 日志里
 * 刷出一堆 error，把真正的网关/上游故障淹掉。
 *
 * 路由侧用法：`return data(buildAIFailure(error, { ... }))`。
 */
export function buildAIFailure(
  error: unknown,
  options: {
    /** 响应 `error` 字段的值（机器可读的失败类别），保持与既有契约一致 */
    errorCode: string
    /** 覆盖 message；缺省用归一化后的错误消息 */
    message?: string
    status?: number
    context?: AIFailureContext
  },
): AIFailureBody {
  const { errorCode, message, status = 500, context } = options
  const aiError = normalizeAIError(error)
  const { targetId, targetType, model, provider } = context ?? {}

  console.error(`[AI] ${errorCode} failed:`, { targetType, targetId, model, provider, status }, error)
  obsLog('ai.fail', {
    code: errorCode,
    status,
    targetType,
    targetId: suffix(targetId),
    model,
    provider,
    aiErrorType: aiError.type,
    reason: aiError.message,
  })

  return {
    success: false,
    error: errorCode,
    status,
    message: message ?? aiError.message,
    targetId,
    targetType,
    model,
    provider,
    aiError,
  }
}
