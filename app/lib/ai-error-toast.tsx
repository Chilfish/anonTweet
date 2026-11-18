import type { AITransportError } from './ai-error'
import { AIErrorDetail } from '~/components/translation/AIErrorDetail'
import { toastManager } from '~/components/ui/toast'
import { describeAIError, describeUnknownAIError } from './ai-error'

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

/**
 * 以友好标题 + 可操作建议展示 AI 失败；结构化细节（状态码 / 端点 / 原始响应 /
 * 模型输出）通过 `AIErrorDetail` 保留，方便排查但不抢占主信息。
 */
export function toastAIError(error: unknown, options: ToastAIErrorOptions = {}): void {
  const aiError = extractAIError(error)

  if (aiError) {
    const presentation = describeAIError(aiError, options)
    toastManager.add({
      title: presentation.title,
      description: (
        <span className="flex flex-col gap-1">
          <span>{presentation.description}</span>
          <AIErrorDetail error={aiError} />
        </span>
      ),
      type: 'error',
      timeout: ERROR_DETAIL_TIMEOUT,
    })
    return
  }

  const presentation = describeUnknownAIError(error, options)
  toastManager.add({
    title: presentation.title,
    description: presentation.description,
    type: 'error',
    timeout: ERROR_DETAIL_TIMEOUT,
  })
}
