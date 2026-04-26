export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high' | 'max'

export interface ModelConfig {
  name: string
  text: string
  provider: 'google' | 'deepseek'
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
