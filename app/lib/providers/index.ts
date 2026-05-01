import type { ProviderStrategy } from './types'
import type { ThinkingLevel } from '~/lib/stores/appConfig'
import { models } from '~/lib/constants'
import { deepseekStrategy } from './deepseek'
import { googleStrategy } from './google'

const strategies: Record<string, ProviderStrategy> = {
  google: googleStrategy,
  deepseek: deepseekStrategy,
}

/**
 * Get the ProviderStrategy for a given provider name.
 * Throws if the provider is unknown.
 */
export function getProviderStrategy(provider: string): ProviderStrategy {
  const strategy = strategies[provider]
  if (!strategy) {
    throw new Error(`Unknown AI provider: ${provider}. Supported: ${Object.keys(strategies).join(', ')}`)
  }
  return strategy
}

/**
 * Convenience: resolve model name → model config → strategy → thinking config.
 * Returns `{ includeThoughts: false }` as fallback for unknown models.
 */
export function getThinkingConfig(modelName: string, level: ThinkingLevel = 'minimal') {
  const modelConfig = models.find(m => m.name === modelName)
  if (!modelConfig) {
    return { includeThoughts: false }
  }
  const strategy = getProviderStrategy(modelConfig.provider)
  return strategy.getThinkingConfig(modelConfig, level)
}

export { deepseekStrategy, googleStrategy }
export type { ProviderStrategy }
