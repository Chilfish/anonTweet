import type { ModelConfig } from '~/lib/constants'
import type { ThinkingLevel } from '~/lib/stores/appConfig'

export interface ProviderStrategy {
  readonly name: string

  /**
   * Create an AI SDK provider instance from an API key.
   * Returns a callable that accepts a model name and returns a LanguageModel.
   */
  createSDKProvider: (apiKey: string) => any

  /**
   * Build thinking configuration for generateText.
   * Maps a user-selected ThinkingLevel to provider-specific config.
   */
  getThinkingConfig: (modelConfig: ModelConfig, level: ThinkingLevel) => any

  /**
   * Build the providerOptions object for generateText.
   * Wraps thinking config into the provider-specific options structure.
   */
  buildProviderOptions: (thinkingConfig: any, modelConfig: ModelConfig) => Record<string, any>
}
