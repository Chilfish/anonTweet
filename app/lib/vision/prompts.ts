import type { VisionMode } from '~/types/vision'
import { z } from 'zod'

/**
 * AI 视觉描述 —— Prompt 预设系统（app/lib/vision/prompts.ts）
 *
 * 三预设：describe（看图说话）/ ocr（结构化 OCR+翻译）/ custom（用户自定义）。
 * schema 一律 `.strict()`：多余键会被拒绝 → 触发上层重试（对齐翻译 validate+retry 模式）。
 */

const describeItemSchema = z.object({
  index: z.number(),
  description: z.string(),
}).strict()

const ocrItemSchema = z.object({
  index: z.number(),
  originalText: z.string(),
  translatedText: z.string(),
}).strict()

export const describeSchema = z.object({
  descriptions: z.array(describeItemSchema),
}).strict()

export const ocrSchema = z.object({
  texts: z.array(ocrItemSchema),
}).strict()

export interface VisionPromptPreset {
  id: 'describe' | 'ocr' | 'custom'
  name: string
  mode: VisionMode
  systemPrompt: string
  schema: z.ZodType<unknown>
}

export const VISION_PROMPT_PRESETS = {
  describe: {
    id: 'describe',
    name: '看图说话',
    mode: 'describe',
    systemPrompt:
      '你是推文配图的视觉描述助手。基于图片内容，用简体中文为每张图片生成简洁、客观、信息密集的描述：主体、动作、场景、画面中的文字（若可见）。单图不超过 100 字；不猜测图片外信息。输出严格 JSON。',
    schema: describeSchema,
  },
  ocr: {
    id: 'ocr',
    name: '结构化 OCR + 翻译',
    mode: 'ocr',
    systemPrompt:
      '你是推文配图的 OCR 助手。逐行提取图片中的所有文字作为 originalText（保持原语言与换行）。若提供了推文上下文，将 originalText 翻译为简体中文填入 translatedText；否则 translatedText 与 originalText 相同。输出严格 JSON。',
    schema: ocrSchema,
  },
} as const

const DEFAULT_CUSTOM_PROMPT
  = '请根据图片内容，用简体中文输出客观、信息密集的描述：主体、动作、场景、画面中的文字（若可见）。输出严格 JSON。'

/**
 * 按 promptId 解析预设。'custom' 或未知 id → 回退自定义：
 * system 用用户提示语，schema 回退 describeSchema（产物按 description 清洗）。
 */
export function getVisionPreset(promptId: string, customPrompt = ''): VisionPromptPreset {
  if (promptId === 'custom' || !(promptId in VISION_PROMPT_PRESETS)) {
    return {
      id: 'custom',
      name: '自定义',
      mode: 'custom',
      systemPrompt: customPrompt || DEFAULT_CUSTOM_PROMPT,
      schema: describeSchema,
    }
  }
  return VISION_PROMPT_PRESETS[promptId as 'describe' | 'ocr']
}
