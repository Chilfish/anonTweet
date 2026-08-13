import type { VisionPromptPreset } from './prompts'
import type { AIVisionInfo, VisionMode } from '~/types/vision'

/**
 * AI 视觉描述 —— 纯函数（app/lib/vision/parse.ts）
 *
 * parseVisionResult：模型 JSON → schema 校验 + 清洗 → AIVisionInfo[]。
 * resolveVisionView：手动覆盖 > AI 结果 > 无视图 三级决策链（对齐翻译系统）。
 * 全部逻辑下沉 lib，组件只渲染（Postmortem #002）。
 */

export class VisionParseError extends Error {}

export function parseVisionResult(
  preset: VisionPromptPreset,
  json: unknown,
): AIVisionInfo[] {
  const parsed = preset.schema.safeParse(json)
  if (!parsed.success) {
    throw new VisionParseError(`Vision schema validation failed: ${parsed.error.message}`)
  }

  const data = parsed.data as {
    descriptions?: Array<{ index: number, description: string }>
    texts?: Array<{ index: number, originalText: string, translatedText: string }>
  }
  const createdAt = Date.now()

  // ocr 模式：schema 为 ocrSchema，读 texts
  if (preset.mode === 'ocr') {
    return (data.texts ?? []).map(t => ({
      index: t.index,
      mode: 'ocr' as const,
      promptId: preset.id,
      provider: '',
      model: '',
      originalText: t.originalText,
      translatedText: t.translatedText,
      status: 'done' as const,
      createdAt,
    }))
  }

  // describe / custom：schema 回退 describeSchema，读 descriptions
  return (data.descriptions ?? []).map(d => ({
    index: d.index,
    mode: (preset.mode === 'custom' ? 'custom' : 'describe') as VisionMode,
    promptId: preset.id,
    provider: '',
    model: '',
    description: d.description,
    status: 'done' as const,
    createdAt,
  }))
}

export interface VisionView {
  /** 该图是否存在可展示的视觉内容 */
  hasView: boolean
  /** 最终展示文本：手动覆盖 > AI 结果 */
  displayText: string
  /** 来源：manual / ai（无视图时缺省） */
  source?: 'manual' | 'ai'
  /** ocr 模式：图片原文（供折叠展示） */
  originalText?: string
  /** 对应的 AI 视觉信息（若存在） */
  aiInfo?: AIVisionInfo
}

export function resolveVisionView(
  aiInfo?: AIVisionInfo,
  manualText?: string,
): VisionView {
  // 1. 手动编辑覆盖优先
  if (manualText && manualText.trim()) {
    return {
      hasView: true,
      displayText: manualText,
      source: 'manual',
      originalText: aiInfo?.originalText,
      aiInfo,
    }
  }
  // 2. AI 结果（describe → description；ocr → translatedText）
  if (aiInfo?.status === 'done') {
    const displayText = aiInfo.description || aiInfo.translatedText || ''
    if (displayText) {
      return {
        hasView: true,
        displayText,
        source: 'ai',
        originalText: aiInfo.originalText,
        aiInfo,
      }
    }
  }
  // 3. 两者皆无 → 无视图（隐藏该图描述区）
  return { hasView: false, displayText: '', aiInfo }
}
