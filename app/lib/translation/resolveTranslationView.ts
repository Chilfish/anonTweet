import type { TranslationMode } from '~/lib/stores/translation'
import type { EnrichedTweet, Entity } from '~/types'
import {
  mergeEntityTranslationsByIndex,
  resolveAIEntitiesForDisplay,
  shouldRenderTranslatedEntitiesDirectly,
} from './resolveEntities'

export type TranslationViewSource = 'manual' | 'ai' | 'original'
export type TranslationViewPart = 'body' | 'alt'

export interface TranslationVisibility {
  body: boolean
  alt: boolean
}

export interface TranslationView {
  shouldShow: boolean
  entities: Entity[]
  source: TranslationViewSource
}

function hasBodyOverlayTranslation(entities: Entity[]) {
  return entities.some(e => e.type !== 'media_alt' && !!e.translation)
}

function hasAltOverlayTranslation(entities: Entity[]) {
  return entities.some(e => e.type === 'media_alt' && !!e.translation)
}

function shouldShowForPart(part: TranslationViewPart, entities: Entity[], source: TranslationViewSource, isAIStream: boolean) {
  if (part === 'alt')
    return hasAltOverlayTranslation(entities)

  // Body:
  // - Overlay-style translations: show only when `.translation` exists on non-alt entities.
  // - AI translated stream (rendered directly): treat as showable even if `.translation` is empty,
  //   because the translated content may live in `.text`.
  if (source === 'ai' && isAIStream)
    return entities.length > 0

  return hasBodyOverlayTranslation(entities)
}

/**
 * Resolve the translated view for a tweet (pure function).
 *
 * Decision priority:
 * 1) `mode` and per-tweet `visibility` gates
 * 2) Manual translation (store) tri-state:
 *    - `null`: explicitly hidden => force original
 *    - `Entity[]`: overlay-style => highest priority
 *    - `undefined`: no manual override
 * 3) AI translation (optional)
 * 4) Legacy embedded translations on `tweet.entities`
 * 5) Original
 */
export function resolveTranslationView(args: {
  tweet: EnrichedTweet
  manualTranslation: Entity[] | null | undefined
  enableAITranslation: boolean
  mode: TranslationMode
  visibility: TranslationVisibility
  part: TranslationViewPart
}): TranslationView {
  const {
    tweet,
    manualTranslation,
    enableAITranslation,
    mode,
    visibility,
    part,
  } = args

  const base = tweet.entities || []

  // 1) Mode gate
  if (mode === 'original') {
    return { shouldShow: false, entities: base, source: 'original' }
  }

  // 2) Visibility gate
  if (part === 'body' && !visibility.body) {
    return { shouldShow: false, entities: base, source: 'original' }
  }
  if (part === 'alt' && !visibility.alt) {
    return { shouldShow: false, entities: base, source: 'original' }
  }

  // 3) Manual tri-state override
  if (manualTranslation === null) {
    return { shouldShow: false, entities: base, source: 'original' }
  }
  if (Array.isArray(manualTranslation) && manualTranslation.length > 0) {
    const entities = mergeEntityTranslationsByIndex(base, manualTranslation)
    return {
      shouldShow: shouldShowForPart(part, entities, 'manual', false),
      entities,
      source: 'manual',
    }
  }

  // 4) AI translation
  const ai = tweet.autoTranslationEntities || []
  if (enableAITranslation && ai.length > 0) {
    const isAIStream = shouldRenderTranslatedEntitiesDirectly(base, ai)
    const entities = resolveAIEntitiesForDisplay(base, ai)
    return {
      shouldShow: shouldShowForPart(part, entities, 'ai', isAIStream),
      entities,
      source: 'ai',
    }
  }

  // 5) Legacy embedded translations on base entities (e.g., DB overlay merged upstream).
  if (base.some(e => !!e.translation)) {
    return {
      shouldShow: shouldShowForPart(part, base, 'manual', false),
      entities: base,
      source: 'manual',
    }
  }

  // 6) Original
  return { shouldShow: false, entities: base, source: 'original' }
}
