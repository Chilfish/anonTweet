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
  /** 主展示文本：ocr → translatedText || originalText；describe/custom → description */
  displayText: string
  /** ocr 模式：图片原文（供折叠展示；translatedOnly 或空时缺省） */
  originalText?: string
  /** 对应的 AI 视觉信息（若存在） */
  aiInfo?: AIVisionInfo
}

export interface ResolveVisionViewOptions {
  /** 仅显示译文：隐藏 ocr 原文，只展示翻译 */
  translatedOnly?: boolean
}

export function resolveVisionView(
  aiInfo?: AIVisionInfo,
  opts?: ResolveVisionViewOptions,
): VisionView {
  if (!aiInfo || aiInfo.status !== 'done') {
    return { hasView: false, displayText: '', aiInfo }
  }
  if (aiInfo.mode === 'ocr') {
    const displayText = aiInfo.translatedText || aiInfo.originalText || ''
    return {
      hasView: !!displayText,
      displayText,
      originalText: aiInfo.originalText && !opts?.translatedOnly
        ? aiInfo.originalText
        : undefined,
      aiInfo,
    }
  }
  // describe / custom：看图说话描述即为展示文本
  const description = aiInfo.description ?? ''
  return { hasView: !!description, displayText: description, aiInfo }
}

/**
 * 合并 AI 生成结果到已有 visionInfo：incoming 命中 index 时整体替换
 * （直接编辑模型——原文/译文/描述即条目字段，无手动覆盖层）。
 * 纯函数，Phase 4 编辑弹窗复用。
 */
export function mergeVisionInfo(
  existing: AIVisionInfo[],
  incoming: AIVisionInfo[],
): AIVisionInfo[] {
  const map = new Map(existing.map(v => [v.index, v]))
  for (const item of incoming) {
    map.set(item.index, item)
  }
  return [...map.values()].sort((a, b) => a.index - b.index)
}

/** 逐图编辑草稿：ocr 模式写原文/译文，describe/custom 写描述 */
export interface VisionDraft {
  originalText?: string
  translatedText?: string
  description?: string
}

/**
 * 应用逐图编辑草稿到 visionInfo：按 photoIndexes 重建——有草稿的图按模式写入字段
 * （ocr 写 originalText/translatedText，describe/custom 写 description），空草稿保留
 * 已有条目；无 AI 条目但草稿有内容则建手动条目。纯函数，编辑弹窗保存时复用。
 */
export function applyVisionEdits(
  visionInfo: AIVisionInfo[],
  drafts: Record<number, VisionDraft>,
  photoIndexes: number[],
): AIVisionInfo[] {
  const next: AIVisionInfo[] = []
  for (const index of photoIndexes) {
    const draft = drafts[index]
    const existing = visionInfo.find(v => v.index === index)
    if (!draft) {
      if (existing)
        next.push(existing)
      continue
    }
    const hasContent = !!(draft.originalText?.trim() || draft.translatedText?.trim() || draft.description?.trim())
    if (!hasContent) {
      if (existing)
        next.push(existing)
      continue
    }
    if (existing) {
      const isOcr = existing.mode === 'ocr'
      next.push({
        ...existing,
        originalText: isOcr ? draft.originalText ?? existing.originalText : existing.originalText,
        translatedText: isOcr ? draft.translatedText ?? existing.translatedText : existing.translatedText,
        description: isOcr ? existing.description : draft.description ?? existing.description,
      })
    }
    else {
      // 纯手动条目：按草稿内容形态推断模式
      const isOcr = !!(draft.originalText?.trim() || draft.translatedText?.trim())
      next.push(isOcr
        ? {
            index,
            mode: 'ocr',
            promptId: 'ocr',
            provider: '',
            model: '',
            originalText: draft.originalText,
            translatedText: draft.translatedText,
            status: 'done',
            createdAt: Date.now(),
          }
        : {
            index,
            mode: 'describe',
            promptId: 'describe',
            provider: '',
            model: '',
            description: draft.description,
            status: 'done',
            createdAt: Date.now(),
          })
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

/**
 * 图片描述块展示状态（纯函数，Postmortem #002：逻辑下沉 lib，组件只渲染）。
 *
 * 可见性模型（对齐 Apple「克制默认 + 渐进披露」）：
 * - 缓存内容（hasContent）是否展示 = 全局开关（enableAIVision）∨ 逐推文覆盖（override）
 * - 全局关 + 有缓存内容：交互模式折叠成「图片描述」细条（点按展开 = 逐推文覆盖开），
 *   截图模式完全隐藏（用户截图时不想要这次的描述结果）
 * - 无内容：仅全局开 + 交互模式显示空态 CTA（生成入口）
 */
export type VisionBlockState = 'content' | 'cta' | 'collapsed' | 'hidden'

export interface ResolveVisionBlockStateOptions {
  /** 是否存在已缓存/已生成内容（visionInfo 有 done/error） */
  hasContent: boolean
  /** 全局「启用图片描述」开关 */
  enableAIVision: boolean
  /** 逐推文可见性覆盖：true=强制展示 / false=强制隐藏 / undefined=跟随全局 */
  override?: boolean
  /** 截图/纯展示上下文：隐藏一切交互 chrome */
  chromeHidden: boolean
}

export function resolveVisionBlockState(
  opts: ResolveVisionBlockStateOptions,
): VisionBlockState {
  const { hasContent, enableAIVision, override, chromeHidden } = opts
  if (hasContent) {
    // 逐推文覆盖优先于全局开关
    const effectiveShow = override ?? enableAIVision
    if (effectiveShow)
      return 'content'
    return chromeHidden ? 'hidden' : 'collapsed'
  }
  if (chromeHidden)
    return 'hidden'
  return enableAIVision ? 'cta' : 'hidden'
}
