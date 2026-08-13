import type { AITransportError } from './ai-error'
import { AIErrorDetail } from '~/components/translation/AIErrorDetail'
import { toastManager } from '~/components/ui/toast'

/** 结构化错误详情需要更多阅读时间，不能走默认 3s 自动关闭 */
const ERROR_DETAIL_TIMEOUT = 8000

interface ToastAIErrorOptions {
  /** 展示在标题里的提供商名，如 "Gemini" / "DeepSeek" */
  providerName?: string
  /** 无结构化错误信息时的兜底标题 */
  fallbackTitle?: string
}

/**
 * 从任意被 reject 的值中提取结构化 AI 错误：
 * - BFF 业务失败：fetcher 拦截器 reject 的响应体（含 `aiError` 字段）
 * - 网络失败：AxiosError 的 `response.data.aiError`
 */
function extractAIError(error: unknown): AITransportError | null {
  if (!error || typeof error !== 'object')
    return null
  const err = error as {
    aiError?: AITransportError
    response?: { data?: { aiError?: AITransportError } }
  }
  return err.aiError ?? err.response?.data?.aiError ?? null
}

function extractMessage(error: unknown): string | undefined {
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
    if ('message' in obj)
      return String(obj.message)
  }
  return undefined
}

/**
 * 以结构化 toast 展示 AI 连接 / 翻译失败详情（端点、状态码、响应体）。
 * 有 `aiError` 时渲染 AIErrorDetail，否则退化为一条普通错误消息。
 */
export function toastAIError(error: unknown, options: ToastAIErrorOptions = {}): void {
  const aiError = extractAIError(error)

  if (aiError) {
    const status = aiError.statusCode != null ? ` · HTTP ${aiError.statusCode}` : ''
    toastManager.add({
      title: `${options.providerName || 'AI'} 连接失败${status}`,
      description: <AIErrorDetail error={aiError} />,
      type: 'error',
      timeout: ERROR_DETAIL_TIMEOUT,
    })
    return
  }

  toastManager.add({
    title: options.fallbackTitle || 'AI 请求失败',
    description: extractMessage(error) || '未知错误，请检查网络或配置',
    type: 'error',
    timeout: ERROR_DETAIL_TIMEOUT,
  })
}
