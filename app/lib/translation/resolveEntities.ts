import type { Entity } from '~/types'

/**
 * Merge `translated` into `base` by matching `index`.
 *
 * - Keeps original entity structure (overlay-style).
 * - Writes translated text into `.translation`.
 * - For some AI results, the translated text might be stored in `.text`; in that case
 *   we treat `.text` as the translation only when it differs from the original `.text`.
 */
export function mergeEntityTranslationsByIndex(base: Entity[], translated: Entity[]) {
  const byIndex = new Map<number, Entity>()
  translated.forEach((e) => {
    byIndex.set(e.index, e)
  })

  return base.map((original) => {
    const found = byIndex.get(original.index)
    if (!found)
      return original
    const translation = found.translation || (found.text !== original.text ? found.text : undefined)
    return translation ? { ...original, translation } : original
  })
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
  return shouldRenderTranslatedEntitiesDirectly(base, ai)
    ? ai
    : mergeEntityTranslationsByIndex(base, ai)
}
