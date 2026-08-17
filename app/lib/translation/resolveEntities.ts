import type { Entity } from '~/types'

/**
 * Merge `translated` into `base` by matching `index`.
 * Writes result into the specified field.
 *
 * `translated` 中 base 不存在的额外实体（如句首补充 `index: -1`）不会被丢弃：
 * 句首补充（index < 0）插入最前，其余额外实体按 index 排序追加到末尾。
 */
export function mergeTranslationsToField(
  base: Entity[],
  translated: Entity[],
  field: 'translation' | 'aiTranslation',
) {
  const byIndex = new Map<number, Entity>()
  translated.forEach((e) => {
    byIndex.set(e.index, e)
  })

  const merged = base.map((original) => {
    const found = byIndex.get(original.index)
    if (!found)
      return original
    // 优先取目标字段，如果没有则尝试从 text 差异中获取
    const translation = found[field] || (found.text !== original.text ? (found.aiTranslation || found.translation || found.text) : undefined)
    return translation ? { ...original, [field]: translation } : original
  })

  // 收集 base 中没有对应 index 的额外实体（如句首补充 index: -1），
  // 只保留带翻译内容的，避免渲染出无意义的裸实体
  const baseIndexSet = new Set(base.map(e => e.index))
  const extras = translated
    .filter(e => !baseIndexSet.has(e.index))
    .filter(e => !!e.translation || !!e.aiTranslation)
    .map(e => ({ ...e, [field]: e[field] || e.translation || e.aiTranslation }))

  const prepends = extras.filter(e => e.index < 0).sort((a, b) => a.index - b.index)
  const tails = extras.filter(e => e.index >= 0).sort((a, b) => a.index - b.index)

  return [...prepends, ...merged, ...tails]
}

/**
 * Legacy wrapper for manual translations
 */
export function mergeEntityTranslationsByIndex(base: Entity[], translated: Entity[]) {
  return mergeTranslationsToField(base, translated, 'translation')
}

/**
 * Determine if `translated` is a standalone translated entity stream that should be rendered directly.
 *
 * This is true when it does not look like an index-aligned overlay for `base`.
 */
export function shouldRenderTranslatedEntitiesDirectly(base: Entity[], translated: Entity[]) {
  if (translated.length !== base.length)
    return true
  const baseIndexSet = new Set(base.map(e => e.index))
  return translated.some(e => !baseIndexSet.has(e.index))
}

/**
 * Resolve AI translated entities for display:
 *
 * - If the AI result is a translated stream, render it directly.
 * - If it is an index-aligned overlay, merge into the base entities.
 */
export function resolveAIEntitiesForDisplay(base: Entity[], ai: Entity[]) {
  if (shouldRenderTranslatedEntitiesDirectly(base, ai)) {
    return ai
  }
  return mergeTranslationsToField(base, ai, 'aiTranslation')
}

export interface DeriveTranslationSource {
  /** TranslationStore 手动翻译（含 index: -1 句首补充实体） */
  manual?: Entity[] | null
  /** 旧版独立 AI 翻译数组（autoTranslationEntities） */
  legacyAI?: Entity[] | null
}

export interface DeriveTranslationOptions {
  /** 仅对指定类型实体计算，其余原样返回（Alt 编辑器只处理 media_alt） */
  types?: Entity['type'][]
}

/**
 * 单一实现的手动翻译选择链（AC-RESOLVER-001）：
 *
 *   manual(按 index 匹配，命中即胜出，即使为空串) > 实体内联 aiTranslation >
 *   legacy autoTranslationEntities(aiTranslation || translation || text) > 原文
 *
 * 两个编辑器 hook（use-translation-editor-logic / use-alt-translation-logic）与显示层
 * 共享此实现，避免三处选择链漂移（review P2-3 / postmortem #009 同类问题）。
 * 纯函数：不修改入参；decode / 字典增强属 UI 层职责，不在本函数内处理。
 */
export function deriveManualTranslation(
  base: Entity[],
  source: DeriveTranslationSource = {},
  opts: DeriveTranslationOptions = {},
): Entity[] {
  const { manual, legacyAI } = source
  const { types } = opts

  const manualIndex = new Map<number, Entity>()
  manual?.forEach(e => manualIndex.set(e.index, e))
  const legacyIndex = new Map<number, Entity>()
  legacyAI?.forEach(e => legacyIndex.set(e.index, e))

  return base.map((entity) => {
    if (types && !types.includes(entity.type))
      return entity

    const manualMatch = manualIndex.get(entity.index)
    if (manualMatch !== undefined)
      return { ...entity, translation: manualMatch.translation || '' }

    if (entity.aiTranslation)
      return { ...entity, translation: entity.aiTranslation }

    const legacyMatch = legacyIndex.get(entity.index)
    const legacyText = legacyMatch?.translation || legacyMatch?.aiTranslation || legacyMatch?.text
    return legacyText ? { ...entity, translation: legacyText } : entity
  })
}
