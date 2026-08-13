import type { AIProvider, AppConfigs, ThinkingLevel } from '~/lib/stores/appConfig'

/** resolveAIConfig 需要的字段子集（对齐 useAIConfig 的返回值） */
export type AIConfigSource = Pick<
  AppConfigs,
  | 'aiProvider'
  | 'geminiApiKey'
  | 'geminiModel'
  | 'geminiBaseUrl'
  | 'geminiThinkingLevel'
  | 'deepseekApiKey'
  | 'deepseekModel'
  | 'deepseekBaseUrl'
  | 'deepseekThinkingLevel'
  | 'openrouterApiKey'
  | 'openrouterModel'
  | 'openrouterBaseUrl'
  | 'openrouterThinkingLevel'
>

export interface ResolvedAIConfig {
  provider: AIProvider
  apiKey: string
  model: string
  baseUrl: string
  thinkingLevel: ThinkingLevel
  providerName: string
}

const PROVIDER_NAMES: Record<AIProvider, string> = {
  google: 'Gemini',
  deepseek: 'DeepSeek',
  openrouter: 'OpenRouter',
}

/**
 * 根据当前选中的 aiProvider，把 store 里的各 provider 配置解析为「当前生效」的一份。
 * 纯函数，供组件 / hook 复用，避免三元重复（Postmortem #002：纯逻辑下沉 lib）。
 */
export function resolveAIConfig(cfg: AIConfigSource): ResolvedAIConfig {
  switch (cfg.aiProvider) {
    case 'google':
      return {
        provider: 'google',
        apiKey: cfg.geminiApiKey,
        model: cfg.geminiModel,
        baseUrl: cfg.geminiBaseUrl,
        thinkingLevel: cfg.geminiThinkingLevel,
        providerName: PROVIDER_NAMES.google,
      }
    case 'deepseek':
      return {
        provider: 'deepseek',
        apiKey: cfg.deepseekApiKey,
        model: cfg.deepseekModel,
        baseUrl: cfg.deepseekBaseUrl,
        thinkingLevel: cfg.deepseekThinkingLevel,
        providerName: PROVIDER_NAMES.deepseek,
      }
    case 'openrouter':
      return {
        provider: 'openrouter',
        apiKey: cfg.openrouterApiKey,
        model: cfg.openrouterModel,
        baseUrl: cfg.openrouterBaseUrl,
        thinkingLevel: cfg.openrouterThinkingLevel,
        providerName: PROVIDER_NAMES.openrouter,
      }
    default:
      throw new Error(`Unknown AI provider: ${cfg.aiProvider satisfies never}`)
  }
}
