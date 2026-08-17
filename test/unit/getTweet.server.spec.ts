import type { EnrichedTweet, TranslationEntity } from '~/types'
import { describe, expect, it } from 'vitest'
import { mergeTranslationEntities } from '~/lib/service/getTweet.server'

describe('mergeTranslationEntities', () => {
  it('merges translation into matching indices and appends media_alt', () => {
    const tweet = {
      id_str: '1',
      user: { screen_name: 'u' },
      entities: [
        { type: 'text', text: 'Hello', index: 0 },
        { type: 'hashtag', text: 'Tag', href: 'https://twitter.com/hashtag/Tag', index: 1 },
      ],
    } as any as EnrichedTweet

    const entities: TranslationEntity[] = [
      { type: 'text', text: 'Hello', translation: '你好', index: 0 },
      { type: 'media_alt', text: 'A CAT', translation: '一只猫', index: 20000 } as any,
    ]

    mergeTranslationEntities(tweet, entities)

    expect(tweet.entities[0]!.translation).toBe('你好')
    expect(tweet.entities.find(e => e.type === 'media_alt')).toMatchObject({
      type: 'media_alt',
      text: 'A CAT',
      translation: '一只猫',
      index: 20000,
    })
  })

  it('restores the prepend entity (index -1) at the front', () => {
    const tweet = {
      id_str: '1',
      user: { screen_name: 'u' },
      entities: [
        { type: 'hashtag', text: '#Tag', href: 'https://twitter.com/hashtag/Tag', index: 0 },
        { type: 'text', text: 'Hello', index: 1 },
      ],
    } as any as EnrichedTweet

    const entities: TranslationEntity[] = [
      { type: 'text', text: '（补充）', index: -1, translation: '（补充）' },
      { type: 'hashtag', text: '#Tag', href: 'https://twitter.com/hashtag/Tag', index: 0, translation: '#标签' } as any,
      { type: 'text', text: 'Hello', index: 1, translation: '你好' },
    ]

    mergeTranslationEntities(tweet, entities)

    expect(tweet.entities[0]).toMatchObject({ type: 'text', index: -1, translation: '（补充）' })
    expect(tweet.entities[1]).toMatchObject({ index: 0, translation: '#标签' })
    expect(tweet.entities[2]).toMatchObject({ index: 1, translation: '你好' })
  })

  it('does not duplicate a media_alt entity when base already contains its index', () => {
    const tweet = {
      id_str: '1',
      user: { screen_name: 'u' },
      entities: [
        { type: 'text', text: 'Hello', index: 0 },
        { type: 'media_alt', text: 'A CAT', index: 20000 } as any,
      ],
    } as any as EnrichedTweet

    const entities: TranslationEntity[] = [
      { type: 'text', text: 'Hello', translation: '你好', index: 0 },
      { type: 'media_alt', text: 'A CAT', translation: '一只猫', index: 20000 } as any,
    ]

    mergeTranslationEntities(tweet, entities)

    const alts = tweet.entities.filter(e => e.type === 'media_alt')
    expect(alts).toHaveLength(1)
    expect(alts[0]!.translation).toBe('一只猫')
  })
})
