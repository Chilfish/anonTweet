/**
 * AI 视觉描述子系统 —— 数据模型（app/types/vision.ts）
 *
 * AIVisionInfo 独立于文本翻译 Entity，避免污染 resolveTranslationView 的
 * aiTranslation 语义（Postmortem #002：逻辑/语义解耦）。挂在
 * `EnrichedTweet.visionInfo?: AIVisionInfo[]` 上。
 */
export type VisionMode = 'describe' | 'ocr' | 'custom'

export interface AIVisionInfo {
  /** 对应 tweet.mediaDetails 数组索引（0-based；与 media_alt 的 20000+i 语义一致，不冲突） */
  index: number
  /** 模式：describe 看图说话 / ocr 结构化 OCR+翻译 / custom 自定义 */
  mode: VisionMode
  /** 使用的提示预设 id：'describe' | 'ocr' | 'custom' */
  promptId: string
  /** 实际使用的 provider */
  provider: string
  /** 实际使用的模型 slug */
  model: string
  /** describe/custom 模式：看图说话描述 */
  description?: string
  /** ocr 模式：图片原文（结构化 OCR，保持原语言与换行） */
  originalText?: string
  /** ocr 模式：翻译为简体中文 */
  translatedText?: string
  /** done = 成功；error = 单图失败 */
  status: 'done' | 'error'
  /** status === 'error' 时的错误信息 */
  error?: string
  /** 生成时间（epoch ms） */
  createdAt: number
}
