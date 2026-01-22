export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high'

export interface ModelConfig {
  name: string
  text: string
  thinkingType: 'level' | 'budget' | 'none'
  supportedLevels?: ThinkingLevel[]
}

export const models: ModelConfig[] = [
  {
    name: 'models/gemini-3-flash-preview',
    text: 'Gemini 3 Flash Preview',
    thinkingType: 'level',
    supportedLevels: ['minimal', 'low', 'medium', 'high'],
  },
  {
    name: 'models/gemini-3-pro-preview',
    text: 'Gemini 3 Pro Preview',
    thinkingType: 'level',
    supportedLevels: ['low', 'high'],
  },
  {
    name: 'models/gemini-2.5-flash-lite',
    text: 'Gemini 2.5 Flash Lite',
    thinkingType: 'budget',
  },
  {
    name: 'models/gemini-2.5-flash',
    text: 'Gemini 2.5 Flash',
    thinkingType: 'budget',
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
    <b style="font-weight: bold; font-size: small;">由 谷歌 翻译自 日语</b>
    <hr style="margin: 3px; border-top-width: 2px;">
  </div>`,
  },
  {
    id: 'preset-gemini',
    name: 'Gemini 翻译风格',
    html: `<div style="margin-top: 4px; color: #3285FD;">
<b style="font-weight: bold; font-size: small;">由 Gemini 3 Flash 翻译</b>
<hr style="margin: 3px; border-top-width: 2px;">
</div>`,
  },
]
