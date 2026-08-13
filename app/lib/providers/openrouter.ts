import type { ProviderStrategy } from './types'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { DEFAULT_OPENROUTER_BASE_URL } from '~/lib/constants'

/**
 * OpenRouter 策略。
 *
 * 与 DeepSeek 同构，走 `@ai-sdk/openai-compatible`：
 * - OpenRouter 是 OpenAI 兼容协议，`baseURL` 默认官方网关 `https://openrouter.ai/api/v1`
 * - thinking 走 `providerOptions.openrouter.reasoning = { enabled, effort }`，
 *   openai-compatible 会把非 schema 键直接 spread 进请求 body，原样透传
 * - 显式开启 `supportsStructuredOutputs`：OpenRouter 多数模型（含 MiMo-V2.5）
 *   支持 `response_format: { type: 'json_schema' }`，默认 false 会退化成
 *   `json_object`（无 schema，结构化输出不可靠）
 */
type OpenRouterEffort = 'minimal' | 'low' | 'medium' | 'high'

function mapLevelToEffort(level: ThinkingLevel): OpenRouterEffort {
  switch (level) {
    case 'low':
      return 'low'
    case 'medium':
      return 'medium'
    case 'high':
      return 'high'
    case 'max':
      return 'high' // OpenRouter reasoning effort 无 max 档，收敛到 high
    default:
      return 'minimal'
  }
}

export const openrouterStrategy: ProviderStrategy = {
  name: 'openrouter',

  createSDKProvider(apiKey, baseUrl) {
    return createOpenAICompatible({
      name: 'openrouter',
      baseURL: baseUrl?.trim() || DEFAULT_OPENROUTER_BASE_URL,
      apiKey,
      supportsStructuredOutputs: true,
    })
  },

  getThinkingConfig(modelConfig, level) {
    if (modelConfig.thinkingType === 'none' || level === 'minimal') {
      return { enabled: false }
    }
    return { enabled: true, effort: mapLevelToEffort(level) }
  },

  buildProviderOptions(thinkingConfig, _modelConfig) {
    return {
      openrouter: { reasoning: thinkingConfig },
    }
  },
}
