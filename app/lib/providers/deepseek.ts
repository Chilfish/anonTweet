import type { ProviderStrategy } from './types'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { DEFAULT_DEEPSEEK_BASE_URL } from '~/lib/constants'

/**
 * DeepSeek 策略。
 *
 * 使用 `@ai-sdk/openai-compatible` 而非 `@ai-sdk/deepseek`：
 * - DeepSeek 官方 API（OpenAI 格式 `/chat/completions`）与 OpenCode Zen/Go
 *   等第三方端点均为 OpenAI 兼容协议
 * - openai-compatible 发送标准 `reasoning_effort`，避免 `@ai-sdk/deepseek`
 *   特有字段在第三方兼容端点上不被识别
 * - 通过 `transformRequestBody` 在「未开启思考」时补发 DeepSeek 官方的
 *   `thinking: { type: 'disabled' }`，并在思考开启时去掉不生效的采样参数
 *
 * 官方语义（https://api-docs.deepseek.com/guides/thinking_mode）：
 * - DeepSeek V4 默认开启思考；`thinking.type = 'enabled' | 'disabled'` 控制开关
 * - `reasoning_effort` 仅接受 `high` / `max`，`low` / `medium` 由服务端映射为 `high`
 * - 思考开启时 `temperature` / `top_p` 不生效（官方直接忽略），因此这里主动省略，
 *   避免把「无效参数」误当成生效配置
 */
type DeepSeekReasoningEffort = 'high' | 'max'

function resolveReasoningEffort(level: ThinkingLevel): 'disabled' | DeepSeekReasoningEffort {
  if (level === 'minimal')
    return 'disabled'
  if (level === 'max')
    return 'max'
  // low / medium / high 统一映射为 high（DeepSeek 官方兼容策略）
  return 'high'
}

interface DeepSeekRequestBody {
  thinking?: { type?: 'enabled' | 'disabled' }
  reasoning_effort?: string | null
  temperature?: number
  top_p?: number
  [key: string]: unknown
}

export const deepseekStrategy: ProviderStrategy = {
  name: 'deepseek',

  createSDKProvider(apiKey, baseUrl) {
    return createOpenAICompatible({
      name: 'deepseek',
      baseURL: baseUrl?.trim() || DEFAULT_DEEPSEEK_BASE_URL,
      apiKey,
      transformRequestBody(body: DeepSeekRequestBody) {
        const thinkingEnabled = body.thinking?.type === 'enabled'
          || (body.thinking == null && body.reasoning_effort != null)

        // 思考开启时 temperature / top_p 不生效：官方与 @ai-sdk/deepseek 都会省略
        if (thinkingEnabled && (body.temperature != null || body.top_p != null)) {
          const { temperature: _temperature, top_p: _topP, ...rest } = body
          return rest
        }

        // OpenAI 兼容协议没有标准 off 开关：未显式设置 thinking 且未开启思考时，
        // 补发 DeepSeek 官方的 thinking disabled，真正关闭思考。
        if (body.thinking == null && body.reasoning_effort == null) {
          return {
            ...body,
            thinking: { type: 'disabled' },
          }
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
    if (thinkingConfig === 'disabled') {
      // 显式关闭：不依赖 transformRequestBody 兜底，自定义 telemetry / 中间层也能看到意图
      return {
        deepseek: {
          thinking: { type: 'disabled' },
        },
      }
    }

    // 思考开启是 DeepSeek V4 的默认行为，这里只下发强度（high / max）
    return {
      deepseek: {
        reasoningEffort: thinkingConfig,
      },
    }
  },
}
