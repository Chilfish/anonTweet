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
})
