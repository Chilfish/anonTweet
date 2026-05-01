import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google'
import type { ProviderStrategy } from './types'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

function mapLevelToBudget(level: ThinkingLevel): number {
  switch (level) {
    case 'minimal': return 0
    case 'low': return 1024
    case 'medium': return 4096
    case 'high': return 16384
    case 'max': return 32768
    default: return 0
  }
}

export const googleStrategy: ProviderStrategy = {
  name: 'google',

  createSDKProvider(apiKey) {
    return createGoogleGenerativeAI({ apiKey })
  },

  getThinkingConfig(modelConfig, level) {
    const config: any = { includeThoughts: false }
    if (modelConfig.thinkingType === 'level') {
      config.thinkingLevel = level
    }
    else if (modelConfig.thinkingType === 'budget') {
      config.thinkingBudget = mapLevelToBudget(level)
    }
    return config
  },

  buildProviderOptions(thinkingConfig, _modelConfig) {
    return {
      google: { thinkingConfig },
    } satisfies Record<string, GoogleGenerativeAIProviderOptions>
  },
}
