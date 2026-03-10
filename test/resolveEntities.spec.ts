import type { Entity } from '~/types'
import { describe, expect, it } from 'vitest'
import {
  mergeEntityTranslationsByIndex,
  resolveAIEntitiesForDisplay,
  shouldRenderTranslatedEntitiesDirectly,
} from '~/lib/translation/resolveEntities'

describe('resolveEntities', () => {
  it('merges overlay-style translations by index', () => {
    const base: Entity[] = [
      { type: 'hashtag', text: '#A', index: 0, href: 'h' } as any,
      { type: 'text', text: 'x', index: 1 },
    ]
    const overlay: Entity[] = [
      { type: 'hashtag', text: '#A', index: 0, translation: '#啊' } as any,
      { type: 'text', text: 'x', index: 1, translation: 'y' },
    ]

    expect(mergeEntityTranslationsByIndex(base, overlay)).toEqual([
      { ...base[0]!, translation: '#啊' },
      { ...base[1]!, translation: 'y' },
    ])
  })

  it('detects stream-style translations (length mismatch)', () => {
    const base: Entity[] = [
      { type: 'text', text: 'x', index: 0 },
    ]
    const stream: Entity[] = [
      { type: 'text', text: 'x', index: 0, translation: 'y' },
      { type: 'hashtag', text: '#A', index: 1, href: 'h' } as any,
    ]

    expect(shouldRenderTranslatedEntitiesDirectly(base, stream)).toBe(true)
    expect(resolveAIEntitiesForDisplay(base, stream)).toBe(stream)
  })

  it('detects stream-style translations (index mismatch)', () => {
    const base: Entity[] = [
      { type: 'text', text: 'x', index: 0 },
      { type: 'text', text: 'z', index: 1 },
    ]
    const stream: Entity[] = [
      { type: 'text', text: 'x', index: 999, translation: 'y' },
      { type: 'text', text: 'z', index: 1000, translation: 'w' },
    ]

    expect(shouldRenderTranslatedEntitiesDirectly(base, stream)).toBe(true)
    expect(resolveAIEntitiesForDisplay(base, stream)).toBe(stream)
  })

  it('resolves overlay-style AI results by merging', () => {
    const base: Entity[] = [
      { type: 'hashtag', text: '#A', index: 0, href: 'h' } as any,
      { type: 'text', text: 'x', index: 1 },
    ]
    const overlay: Entity[] = [
      { type: 'hashtag', text: '#A', index: 0 } as any,
      { type: 'text', text: 'x', index: 1, translation: 'y' },
    ]

    expect(shouldRenderTranslatedEntitiesDirectly(base, overlay)).toBe(false)
    expect(resolveAIEntitiesForDisplay(base, overlay)).toEqual([
      base[0]!,
      { ...base[1]!, translation: 'y' },
    ])
  })
})
