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

const EMPTY_OUTPUT_RE = /^\s*$/
const TIMEOUT_RE = /timeout|timed out|aborted|abort/i
const NETWORK_ERROR_RE = /failed to fetch|load failed|networkerror|network error|econnrefused|enotfound|socket hang up/i
const BALANCE_RE = /insufficient|balance|quota|余额|额度/i
const AUTH_RE = /invalid.*api.?key|authentication|unauthorized|forbidden|incorrect api key/i
const RATE_LIMIT_RE = /rate limit|too many requests|限流/i
const VALIDATION_ERROR_RE = /AI Translation Validation Failed/i

/** 面向用户的错误展示（标题 + 可操作建议） */
export interface AIErrorPresentation {
  title: string
  description: string
}

function isTimeoutLike(message: string, type?: string): boolean {
  return type === 'AbortError'
    || type === 'TimeoutError'
    || TIMEOUT_RE.test(message)
}

function providerLabel(options: { providerName?: string }): string {
  return options.providerName || 'AI'
}

/**
 * 把结构化 AI 错误翻译成用户能看懂的标题与建议。
 * 技术细节（状态码 / 端点 / 原始响应）仍由 `AIErrorDetail` 展示，避免只给一句英文报错。
 */
export function describeAIError(
  error: AITransportError,
  options: { providerName?: string, fallbackTitle?: string } = {},
): AIErrorPresentation {
  const name = providerLabel(options)
  const providerMessage = error.providerMessage ?? ''

  if (error.type === 'NoObjectGeneratedError') {
    const isEmpty = !error.generatedText || EMPTY_OUTPUT_RE.test(error.generatedText)
    if (isEmpty) {
      return {
        title: '模型返回了空内容',
        description: `${name} 没有返回任何可解析内容（DeepSeek 的 JSON 模式会把无法识别的输出替换成空格）。已自动重试一次仍失败，请再试一次；持续出现可降低思考强度或更换模型。`,
      }
    }
    if (error.finishReason === 'length') {
      return {
        title: '模型输出被截断',
        description: '生成内容达到长度上限，没能形成完整 JSON。请重试，或换用输出上限更高的模型。',
      }
    }
    return {
      title: '模型返回格式无法解析',
      description: `${name} 没有按要求的 JSON 格式返回，已自动重试一次。请重试；若持续失败，可降低思考强度或更换模型。`,
    }
  }

  if (VALIDATION_ERROR_RE.test(error.message)) {
    return {
      title: '翻译结果校验失败',
      description: '模型改写或遗漏了必须保留的占位符（@、话题、链接），已自动重试一次仍不符合要求。请重试；持续失败可降低思考强度或更换模型。',
    }
  }

  if (isTimeoutLike(error.message, error.type)) {
    return {
      title: `${name} 请求超时`,
      description: '模型思考时间过长。可把思考强度调低（如 high → minimal）后重试，或稍后再试。',
    }
  }

  if (error.type === 'APICallError') {
    const status = error.statusCode
    if (status === 402 || BALANCE_RE.test(providerMessage)) {
      return {
        title: `${name} 账户余额不足`,
        description: '请到服务商控制台充值后重试。',
      }
    }
    if (status === 401 || status === 403 || AUTH_RE.test(providerMessage)) {
      return {
        title: `${name} 认证失败`,
        description: `API Key 无效或没有该模型权限。请检查 API Key 与 Base URL${providerMessage
          ? `（${providerMessage}）`
          : ''}。`,
      }
    }
    if (status === 429 || RATE_LIMIT_RE.test(providerMessage)) {
      return {
        title: `${name} 请求被限流`,
        description: '请求过于频繁，请稍后重试或降低并发。',
      }
    }
    if (status === 404) {
      return {
        title: `${name} 模型或接口不存在`,
        description: '请检查模型 ID 与 Base URL（例如 DeepSeek 使用 deepseek-flash）。',
      }
    }
    if (status != null && status >= 500) {
      return {
        title: `${name} 服务暂时不可用`,
        description: '上游服务异常，请稍后重试。',
      }
    }
    if (status === 400) {
      return {
        title: `${name} 拒绝了请求参数`,
        description: `请检查模型名、Base URL 与参数${providerMessage
          ? `：${providerMessage}`
          : '。'}`,
      }
    }
    return {
      title: options.fallbackTitle || `${name} 请求失败`,
      description: providerMessage || '请检查网络、API Key、Base URL 与模型名。',
    }
  }

  if (NETWORK_ERROR_RE.test(error.message)) {
    return {
      title: `${name} 网络连接失败`,
      description: '浏览器可能被 CORS 拦截，或网络不可达。可切回服务端中继，或检查 Base URL。',
    }
  }

  return {
    title: options.fallbackTitle || `${name} 请求失败`,
    description: error.message || '未知错误，请检查网络或配置。',
  }
}

function unknownErrorMessage(error: unknown): string {
  if (error instanceof Error)
    return error.message
  if (typeof error === 'string')
    return error
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>
    if (typeof obj.message === 'string' && obj.message)
      return obj.message
    if (typeof obj.error === 'string' && obj.error)
      return obj.error
  }
  return ''
}

/** 无结构化 `aiError` 时的兜底展示（网络失败 / BFF 业务失败等） */
export function describeUnknownAIError(
  error: unknown,
  options: { providerName?: string, fallbackTitle?: string } = {},
): AIErrorPresentation {
  const name = providerLabel(options)
  const message = unknownErrorMessage(error)

  if (isTimeoutLike(message)) {
    return {
      title: `${name} 请求超时`,
      description: '模型响应时间过长，请稍后重试或降低思考强度。',
    }
  }
  if (NETWORK_ERROR_RE.test(message)) {
    return {
      title: `${name} 网络连接失败`,
      description: '请检查网络与 Base URL；浏览器直连被拒绝时可切回服务端中继。',
    }
  }

  return {
    title: options.fallbackTitle || `${name} 请求失败`,
    description: message || '未知错误，请检查网络或配置。',
  }
}

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
      generatedText: error.text
        ? error.text.slice(0, GENERATED_TEXT_LIMIT)
        : undefined,
      finishReason: error.finishReason,
    }
  }
  if (AISDKError.isInstance(error)) {
    return { type: error.name, message: error.message }
  }
  if (error instanceof Error) {
    return { type: 'Error', message: error.message }
  }
  return {
    type: 'UnknownError',
    message: String(error),
  }
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
  const statusLabel = aiError.statusCode != null
    ? ` HTTP ${aiError.statusCode}`
    : ''

  // 把原因写进第一段字符串：Cloudflare / 平台日志只稳定保留 console.error 的首个参数，
  // 旧写法把 error 作为第二参数会让线上只剩上下文、看不到真实原因。
  console.error(
    `[AI] ${errorCode} failed (${aiError.type}${statusLabel}): ${aiError.message}`,
    {
      targetType,
      targetId,
      model,
      provider,
      status,
      providerMessage: aiError.providerMessage,
      finishReason: aiError.finishReason,
    },
  )
  obsLog('ai.fail', {
    code: errorCode,
    status,
    targetType,
    targetId: suffix(targetId),
    model,
    provider,
    aiErrorType: aiError.type,
    httpStatus: aiError.statusCode,
    finishReason: aiError.finishReason,
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
