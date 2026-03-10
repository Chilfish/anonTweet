import type { EnrichedTweet, Entity } from '~/types'
import { describe, expect, it } from 'vitest'
import { stripTranslationsFromTweets } from '~/lib/stores/logic'
import { materializeTweetWithManualTranslations } from '~/lib/translation/materialize'

describe('translation materialization', () => {
  it('strips translation fields from tweet.entities without mutating input', () => {
    const input: EnrichedTweet = {
      id_str: '1',
      lang: 'ja',
      url: 'u',
      created_at: 'd',
      text: 't',
      user: { id_str: 'u1', name: 'n', screen_name: 's', is_blue_verified: false, profile_image_shape: 'Circle', profile_image_url_https: '' } as any,
      entities: [
        { type: 'text', text: 'a', index: 0, translation: 'A' },
      ],
    } as any

    const cloned = structuredClone(input)
    const [cleaned] = stripTranslationsFromTweets([input])

    expect(input).toEqual(cloned)
    expect(cleaned!.entities[0]).toMatchObject({ type: 'text', text: 'a', index: 0 })
    expect((cleaned!.entities[0] as any).translation).toBeUndefined()
  })

  it('materializes manual translations as an overlay view-model', () => {
    const tweet: EnrichedTweet = {
      id_str: '1',
      lang: 'ja',
      url: 'u',
      created_at: 'd',
      text: 't',
      user: { id_str: 'u1', name: 'n', screen_name: 's', is_blue_verified: false, profile_image_shape: 'Circle', profile_image_url_https: '' } as any,
      entities: [
        { type: 'text', text: 'hello', index: 0 },
        { type: 'hashtag', text: '#A', index: 1, href: 'h' } as any,
      ],
    } as any

    const manual: Entity[] = [
      { type: 'text', text: 'hello', index: 0, translation: '你好' },
      { type: 'hashtag', text: '#A', index: 1, translation: '#啊' } as any,
    ]

    const view = materializeTweetWithManualTranslations(tweet, manual)

    expect(view).not.toBe(tweet)
    expect(view.entities[0]).toMatchObject({ type: 'text', text: 'hello', index: 0, translation: '你好' })
    expect(view.entities[1]).toMatchObject({ type: 'hashtag', text: '#A', index: 1, translation: '#啊' })
    expect((tweet.entities[0] as any).translation).toBeUndefined()
  })
})
