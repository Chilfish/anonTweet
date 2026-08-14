import type { VisionMode } from '~/types/vision'
import { z } from 'zod'

/**
 * AI 视觉描述 —— Prompt 预设系统（app/lib/vision/prompts.ts）
 *
 * 三预设：describe（看图说话）/ ocr（结构化 OCR）/ custom（用户自定义）。
 * schema 一律 `.strict()`：多余键会被拒绝 → 触发上层重试（对齐翻译 validate+retry 模式）。
 *
 * 反幻觉协议（对齐翻译侧 Conservative Naming Protocol）：
 * - describe：专有名词（人名/作品/品牌/角色）只有图中文字或上下文/术语表明确给出才写名称，
 *   否则用视觉特征描述；看不清/模糊 → 明说，不脑补；空/纯色图如实描述。
 * - ocr：只提取图中可见文字，无文字输出空字符串，不把推文文字当图片文字。
 * - describe schema `description.trim().min(1)`：空/纯空白描述 = 幻觉性失败 → 触发重试。
 */

const describeItemSchema = z.object({
  index: z.number(),
  description: z.string().trim().min(1, 'description 不能为空（模型不得输出空/纯空白描述）'),
}).strict()

const ocrItemSchema = z.object({
  index: z.number(),
  originalText: z.string(),
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
      `你是推文配图的视觉描述助手，用简体中文为每张图片生成客观、信息密集的描述：主体、动作、场景、画面中的文字（若可见）。单图不超过 100 字。

# 输出要求
- 每张图片只输出一个对象；index 必须使用用户消息中给出的图片索引，不得自编序号。
- 输出严格 JSON：{"descriptions": [{"index": 0, "description": "..."}]}，不要输出任何多余文字或 markdown。

# 反幻觉协议（必须遵守）
1. 只描述图中可见内容。推文上下文、术语表仅用于辅助理解，绝不把上下文内容当作图片内容。
2. 名称协议：人名、作品、品牌、角色等专有名词，只有图中文字或上下文/术语表明确给出时才写出名称；否则用视觉特征描述（如"穿蓝色连衣裙的角色"），绝不猜测或编造名称。
3. 看不清 / 模糊 / 裁切 / 分辨率不足 → 明确写出"图片模糊，无法辨认"或"看不清"等，不要脑补细节。
4. 纯色 / 黑屏 / 空白等无内容图片 → 如实描述（如"纯色背景，无内容"），不要虚构主体。
5. 术语表优先：术语表中出现的名称，描述时必须使用术语表给出的对应译名。`,
    schema: describeSchema,
  },
  ocr: {
    id: 'ocr',
    name: 'OCR 识别',
    mode: 'ocr',
    systemPrompt:
      `你是推文配图的 OCR 助手。每张图片只输出一个对象（一张图一个对象，不得按文字行拆成多个对象）：originalText 为该图片中的全部文字（多行内容保留原顺序与换行）。只提取文字，不翻译、不改写。index 必须使用用户消息中给出的图片索引，不得自编序号。输出严格 JSON：{"texts": [{"index": 0, "originalText": "..."}]}。

# 反幻觉协议（必须遵守）
1. 只提取图中可见的文字，绝不编造不存在的文字。
2. 图中无文字 → originalText 输出空字符串 ""，不要虚构文字。
3. 不要把推文文字、上下文文字或术语表内容当作图片文字。
4. 水印、角标、Logo 等若可见同样提取，保持原样。`,
    schema: ocrSchema,
  },
} as const

const DEFAULT_CUSTOM_PROMPT
  = '请根据图片内容，用简体中文输出客观、信息密集的描述：主体、动作、场景、画面中的文字（若可见）。只描述图中可见内容；看不清/无法判断时如实说明，不要猜测或编造。输出严格 JSON。'

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
