import type { ProviderStrategy } from './types'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { DEFAULT_DEEPSEEK_BASE_URL } from '~/lib/constants'

/**
 * DeepSeek 策略。
 *
 * 使用 `@ai-sdk/openai-compatible` 而非 `@ai-sdk/deepseek`：
 * - DeepSeek 官方 API 与 OpenCode Zen/Go 端点均为 OpenAI 兼容协议
 * - openai-compatible 发送标准 `reasoning_effort`，避免 `@ai-sdk/deepseek`
 *   特有的 `thinking: { type }` 字段在第三方兼容端点上不被识别
 * - 通过 `transformRequestBody` 在「未开启思考」时补发 DeepSeek 官方
 *   的 `thinking: { type: 'disabled' }`，真正关闭思考（OpenAI 兼容端点
 *   没有标准 off 开关）
 */
function resolveReasoningEffort(level: ThinkingLevel): 'disabled' | 'high' | 'max' {
  if (level === 'minimal')
    return 'disabled'
  if (level === 'max')
    return 'max'
  // low / medium / high 统一映射为 high（DeepSeek 官方兼容策略）
  return 'high'
}

export const deepseekStrategy: ProviderStrategy = {
  name: 'deepseek',

  createSDKProvider(apiKey, baseUrl) {
    return createOpenAICompatible({
      name: 'deepseek',
      baseURL: baseUrl?.trim() || DEFAULT_DEEPSEEK_BASE_URL,
      apiKey,
      transformRequestBody(body) {
        if (body.reasoning_effort == null) {
          return { ...body, thinking: { type: 'disabled' } }
        }
        return body
      },
    })
  },

  getThinkingConfig(_modelConfig, level) {
    return resolveReasoningEffort(level)
  },

  buildProviderOptions(thinkingConfig, modelConfig) {
    if (modelConfig.thinkingType !== 'level')
      return {}
    if (thinkingConfig === 'disabled')
      return {}

    return {
      deepseek: {
        reasoningEffort: thinkingConfig,
      },
    }
  },
}
