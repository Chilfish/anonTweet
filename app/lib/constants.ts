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
  /** 是否支持图片输入：AI 视觉子系统的模型下拉按此过滤（`deepseek-v4-pro` 不支持） */
  supportsVision: boolean
  supportedLevels?: ThinkingLevel[]
}

/**
 * 模型注册表。
 *
 * DeepSeek 官方当前只有两个在售模型（https://api-docs.deepseek.com/quick_start/pricing）：
 * - `deepseek-flash`：DeepSeek-V4.1-Flash 的官方别名，1M 上下文 / 384K 最大输出，
 *   同时支持文本、图片输入与思考模式（默认开启）。旧名 `deepseek-v4-flash`、
 *   `deepseek-v4-flash-vision-exp` 仍被接受但已退役。
 * - `deepseek-v4-pro`：纯文本，不支持图片输入。
 *
 * 思考强度映射：`minimal` = 关闭思考；`low/medium/high` → `high`；`max` → `max`
 * （官方 reasoning_effort 仅接受 high/max，low/medium 由服务端映射为 high）。
 */
export const models: ModelConfig[] = [
  {
    name: 'models/gemini-3-flash-preview',
    text: 'Gemini 3 Flash Preview',
    provider: 'google',
    thinkingType: 'level',
    supportsVision: true,
    supportedLevels: ['minimal', 'low', 'medium', 'high'],
  },
  {
    name: 'models/gemini-3.1-pro-preview',
    text: 'Gemini 3.1 Pro Preview',
    provider: 'google',
    thinkingType: 'level',
    supportsVision: true,
    supportedLevels: ['low', 'high'],
  },
  {
    name: 'models/gemini-3.1-flash-lite-preview',
    text: 'Gemini 3.1 Flash Lite',
    provider: 'google',
    thinkingType: 'budget',
    supportsVision: true,
  },
  {
    name: 'deepseek-flash',
    text: 'DeepSeek Flash (V4.1)',
    provider: 'deepseek',
    thinkingType: 'level',
    supportsVision: true,
    supportedLevels: ['minimal', 'high', 'max'],
  },
  {
    name: 'deepseek-v4-pro',
    text: 'DeepSeek V4 Pro',
    provider: 'deepseek',
    thinkingType: 'level',
    supportsVision: false,
    supportedLevels: ['minimal', 'high', 'max'],
  },
  {
    name: 'xiaomi/mimo-v2.5',
    text: 'MiMo V2.5 (OpenRouter)',
    provider: 'openrouter',
    thinkingType: 'level',
    supportsVision: true,
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
