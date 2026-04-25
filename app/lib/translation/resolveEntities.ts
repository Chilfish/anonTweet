import type { Entity } from '~/types'

/**
 * Merge `translated` into `base` by matching `index`.
 * Writes result into the specified field.
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

  return base.map((original) => {
    const found = byIndex.get(original.index)
    if (!found)
      return original
    // 优先取目标字段，如果没有则尝试从 text 差异中获取
    const translation = found[field] || (found.text !== original.text ? (found.aiTranslation || found.translation || found.text) : undefined)
    return translation ? { ...original, [field]: translation } : original
  })
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
