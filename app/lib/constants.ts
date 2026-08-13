export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high' | 'max'

/**
 * 各 AI 提供商的官方默认 Base URL。
 * 设置面板中作为占位提示，留空时 SDK 会回退到自身默认值。
 */
export const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
export const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
export const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export type AIProviderName = 'google' | 'deepseek' | 'openrouter'

export interface ModelConfig {
  name: string
  text: string
  provider: AIProviderName
  thinkingType: 'level' | 'budget' | 'none'
  supportedLevels?: ThinkingLevel[]
}

export const models: ModelConfig[] = [
  {
    name: 'models/gemini-3-flash-preview',
    text: 'Gemini 3 Flash Preview',
    provider: 'google',
    thinkingType: 'level',
    supportedLevels: ['minimal', 'low', 'medium', 'high'],
  },
  {
    name: 'models/gemini-3.1-pro-preview',
    text: 'Gemini 3.1 Pro Preview',
    provider: 'google',
    thinkingType: 'level',
    supportedLevels: ['low', 'high'],
  },
  {
    name: 'models/gemini-3.1-flash-lite-preview',
    text: 'Gemini 3.1 Flash Lite',
    provider: 'google',
    thinkingType: 'budget',
  },
  {
    name: 'deepseek-v4-flash',
    text: 'DeepSeek V4 Flash',
    provider: 'deepseek',
    thinkingType: 'level',
    supportedLevels: ['minimal', 'high', 'max'],
  },
  {
    name: 'deepseek v4 pro',
    text: 'DeepSeek V4 Pro',
    provider: 'deepseek',
    thinkingType: 'level',
    supportedLevels: ['minimal', 'high', 'max'],
  },
  {
    name: 'xiaomi/mimo-v2.5',
    text: 'MiMo V2.5 (OpenRouter)',
    provider: 'openrouter',
    thinkingType: 'level',
    supportedLevels: ['minimal', 'low', 'medium', 'high'],
  },
]

export interface SeparatorTemplate {
  id: string
  name: string
  html: string
}
export const DEFAULT_TEMPLATES: SeparatorTemplate[] = [
  {
    id: 'preset-google',
    name: '谷歌翻译风格',
    html: `<div style="margin-top: 4px; color: #1d9bf0;">
    <b style="font-weight: bold; font-size: small;">由 谷歌 翻译</b>
    <hr style="margin: 3px; border-top-width: 2px;">
  </div>`,
  },
  {
    id: 'preset-gemini',
    name: 'Gemini 翻译风格',
    html: `<div style="margin-top: 4px; color: #3285FD;">
<b style="font-weight: bold; font-size: small;">由 Gemini 翻译</b>
<hr style="margin: 3px; border-top-width: 2px;">
</div>`,
  },
  {
    id: 'preset-deepseek',
    name: 'DeepSeek 翻译风格',
    html: `<div style="margin-top: 4px; color: #4D6BFE;">
<b style="font-weight: bold; font-size: small;">由 DeepSeek 翻译</b>
<hr style="margin: 3px; border-top-width: 2px;">
</div>`,
  },
]
