import type { DeepSeekLanguageModelOptions } from '@ai-sdk/deepseek'
import type { ProviderStrategy } from './types'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import { createDeepSeek } from '@ai-sdk/deepseek'

function resolveReasoningEffort(level: ThinkingLevel): 'disabled' | 'max' | 'low' | 'medium' | 'high' | 'xhigh' {
  if (level === 'minimal')
    return 'disabled'
  if (level === 'max')
    return 'max'
  return 'high'
}

export const deepseekStrategy: ProviderStrategy = {
  name: 'deepseek',

  createSDKProvider(apiKey) {
    return createDeepSeek({ apiKey })
  },

  getThinkingConfig(_modelConfig, level) {
    return resolveReasoningEffort(level)
  },

  buildProviderOptions(thinkingConfig, modelConfig) {
    if (modelConfig.thinkingType !== 'level')
      return {}

    return {
      deepseek: {
        thinking: {
          type: thinkingConfig === 'disabled' ? 'disabled' : 'enabled',
        },
        ...(thinkingConfig !== 'disabled' && typeof thinkingConfig === 'string'
          ? { reasoningEffort: thinkingConfig as 'low' | 'medium' | 'high' | 'xhigh' }
          : {}),
      },
    } satisfies Record<string, DeepSeekLanguageModelOptions>
  },
}
