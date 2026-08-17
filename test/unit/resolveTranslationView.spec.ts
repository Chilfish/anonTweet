import type { EnrichedTweet, Entity } from '~/types'
import { describe, expect, it } from 'vitest'
import { resolveTranslationView } from '~/lib/translation/resolveTranslationView'

function makeTweet(base: Entity[], ai?: Entity[]): EnrichedTweet {
  return {
    id_str: 't1',
    url: 'u',
    created_at: 'now',
    user: { name: 'n', screen_name: 's' } as any,
    entities: base,
    autoTranslationEntities: ai,
  } as any
}

describe('resolveTranslationView', () => {
  it('forces original when manual translation is explicitly hidden (null)', () => {
    const base: Entity[] = [{ type: 'text', text: 'x', index: 0 }]
    const ai: Entity[] = [{ type: 'text', text: 'x', index: 0, translation: 'y' }]

    const view = resolveTranslationView({
      tweet: makeTweet(base, ai),
      manualTranslation: null,
      mode: 'bilingual',
      visibility: { body: true, alt: true },
      part: 'body',
    })

    expect(view.source).toBe('original')
    expect(view.shouldShow).toBe(false)
    expect(view.entities).toBe(base)
  })

  it('prioritizes manual overlay over AI', () => {
    const base: Entity[] = [{ type: 'text', text: 'x', index: 0 }]
    const manual: Entity[] = [{ type: 'text', text: 'x', index: 0, translation: 'm' }]
    const ai: Entity[] = [{ type: 'text', text: 'x', index: 0, translation: 'a' }]

    const view = resolveTranslationView({
      tweet: makeTweet(base, ai),
      manualTranslation: manual,
      mode: 'bilingual',
      visibility: { body: true, alt: true },
      part: 'body',
    })

    expect(view.source).toBe('manual')
    expect(view.shouldShow).toBe(true)
    expect(view.entities).toEqual([{ ...base[0]!, translation: 'm' }])
  })

  it('treats AI translated stream as showable even without `.translation`', () => {
    const base: Entity[] = [{ type: 'text', text: 'hello', index: 0 }]
    const aiStream: Entity[] = [
      { type: 'text', text: '你好', index: 0 },
      { type: 'text', text: '！', index: 1 },
    ]

    const view = resolveTranslationView({
      tweet: makeTweet(base, aiStream),
      manualTranslation: undefined,
      mode: 'bilingual',
      visibility: { body: true, alt: true },
      part: 'body',
    })

    expect(view.source).toBe('ai')
    expect(view.shouldShow).toBe(true)
    expect(view.entities).toBe(aiStream)
  })

  it('shows cached AI translation even without the global toggle (data-driven)', () => {
    const base: Entity[] = [{ type: 'text', text: 'hello', index: 0, aiTranslation: '你好' }]

    const view = resolveTranslationView({
      tweet: makeTweet(base),
      manualTranslation: undefined,
      mode: 'bilingual',
      visibility: { body: true, alt: true },
      part: 'body',
    })

    expect(view.source).toBe('ai')
    expect(view.shouldShow).toBe(true)
  })

  it('respects visibility gates', () => {
    const base: Entity[] = [{ type: 'text', text: 'x', index: 0 }]
    const manual: Entity[] = [{ type: 'text', text: 'x', index: 0, translation: 'm' }]

    const view = resolveTranslationView({
      tweet: makeTweet(base),
      manualTranslation: manual,
      mode: 'bilingual',
      visibility: { body: false, alt: true },
      part: 'body',
    })

    expect(view.shouldShow).toBe(false)
    expect(view.source).toBe('original')
  })

  it('computes shouldShow separately for body and alt parts', () => {
    const base: Entity[] = [
      { type: 'text', text: 'x', index: 0 },
      { type: 'media_alt', text: 'alt', index: 20000 },
    ]
    const manualBodyOnly: Entity[] = [
      { type: 'text', text: 'x', index: 0, translation: 'y' },
      { type: 'media_alt', text: 'alt', index: 20000 },
    ]

    const bodyView = resolveTranslationView({
      tweet: makeTweet(base),
      manualTranslation: manualBodyOnly,
      mode: 'bilingual',
      visibility: { body: true, alt: true },
      part: 'body',
    })
    const altView = resolveTranslationView({
      tweet: makeTweet(base),
      manualTranslation: manualBodyOnly,
      mode: 'bilingual',
      visibility: { body: true, alt: true },
      part: 'alt',
    })

    expect(bodyView.shouldShow).toBe(true)
    expect(altView.shouldShow).toBe(false)
  })

  it('falls back to legacy embedded translations on tweet.entities', () => {
    const base: Entity[] = [{ type: 'text', text: 'x', index: 0, translation: 'y' }]

    const view = resolveTranslationView({
      tweet: makeTweet(base),
      manualTranslation: undefined,
      mode: 'bilingual',
      visibility: { body: true, alt: true },
      part: 'body',
    })

    expect(view.source).toBe('manual')
    expect(view.shouldShow).toBe(true)
    expect(view.entities).toBe(base)
  })

  it('shows the prepend entity (index -1) at the front for manual translations', () => {
    const base: Entity[] = [{ type: 'text', text: 'hello', index: 0 }]
    const manual: Entity[] = [
      { type: 'text', text: '（补充）', index: -1, translation: '（补充）' },
      { type: 'text', text: 'hello', index: 0, translation: '你好' },
    ]

    const view = resolveTranslationView({
      tweet: makeTweet(base),
      manualTranslation: manual,
      mode: 'bilingual',
      visibility: { body: true, alt: true },
      part: 'body',
    })

    expect(view.source).toBe('manual')
    expect(view.shouldShow).toBe(true)
    expect(view.entities).toEqual([
      { type: 'text', text: '（补充）', index: -1, translation: '（补充）' },
      { ...base[0]!, translation: '你好' },
    ])
  })

  it('shows the view when only a prepend exists (no other translations)', () => {
    const base: Entity[] = [{ type: 'text', text: 'hello', index: 0 }]
    const manual: Entity[] = [
      { type: 'text', text: '（补充）', index: -1, translation: '（补充）' },
    ]

    const view = resolveTranslationView({
      tweet: makeTweet(base),
      manualTranslation: manual,
      mode: 'bilingual',
      visibility: { body: true, alt: true },
      part: 'body',
    })

    expect(view.source).toBe('manual')
    expect(view.shouldShow).toBe(true)
    expect(view.entities).toEqual([
      { type: 'text', text: '（补充）', index: -1, translation: '（补充）' },
      base[0]!,
    ])
  })
})
