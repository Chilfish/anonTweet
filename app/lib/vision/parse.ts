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
    texts?: Array<{ index: number, originalText: string }>
  }
  const createdAt = Date.now()

  // ocr 模式：纯 OCR，只映射 originalText（translatedText 由独立翻译步写入）
  if (preset.mode === 'ocr') {
    return (data.texts ?? []).map(t => ({
      index: t.index,
      mode: 'ocr' as const,
      promptId: preset.id,
      provider: '',
      model: '',
      originalText: t.originalText,
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

/**
 * 合并 AI 生成结果到已有 visionInfo：incoming 命中 index 时替换，
 * 但保留已有条目上的 manualDescription（手动覆盖不被 AI 重生成冲掉）。
 * 纯函数，Phase 4 编辑弹窗复用。
 */
export function mergeVisionInfo(
  existing: AIVisionInfo[],
  incoming: AIVisionInfo[],
): AIVisionInfo[] {
  const map = new Map(existing.map(v => [v.index, v]))
  for (const item of incoming) {
    const prev = map.get(item.index)
    map.set(item.index, { ...item, manualDescription: prev?.manualDescription })
  }
  return [...map.values()].sort((a, b) => a.index - b.index)
}

/**
 * 应用手动覆盖：按 photoIndexes 重建 visionInfo——manual 非空时写入
 * manualDescription（无 AI 条目则建手动条目）；manual 清空时移除旧覆盖回到 AI 结果。
 * 纯函数，Phase 4 编辑弹窗保存时复用。
 */
export function applyManualOverrides(
  visionInfo: AIVisionInfo[],
  manualTexts: Record<number, string>,
  photoIndexes: number[],
): AIVisionInfo[] {
  const next: AIVisionInfo[] = []
  for (const index of photoIndexes) {
    const manual = manualTexts[index]?.trim()
    const existing = visionInfo.find(v => v.index === index)
    if (manual) {
      next.push(existing
        ? { ...existing, manualDescription: manual }
        : {
            index,
            mode: 'describe',
            promptId: 'describe',
            provider: '',
            model: '',
            description: manual,
            manualDescription: manual,
            status: 'done',
            createdAt: Date.now(),
          })
    }
    else if (existing) {
      next.push(
        existing.manualDescription
          ? { ...existing, manualDescription: undefined }
          : existing,
      )
    }
  }
  return next.sort((a, b) => a.index - b.index)
}

/**
 * 结果索引对齐：模型对「哪张图对应哪个 index」不可靠（曾 describe 单图返回 index 1、
 * ocr 把行号当 index），结果数量与请求图片一致时按序强制重映射到请求的 mediaDetails
 * 索引，保证 UI 按图查找（find(v => v.index === i)）命中。数量不一致（如 ocr 仍拆多条）
 * 时保留模型索引，交由上层按描述内容合并。
 * 纯函数，服务端编排层 parse 后调用。
 */
export function alignVisionIndexes(
  info: AIVisionInfo[],
  requestedIndexes: number[],
): AIVisionInfo[] {
  if (info.length !== requestedIndexes.length) {
    return info
  }
  return info.map((item, i) => ({ ...item, index: requestedIndexes[i]! }))
}
