import type { EnrichedTweet } from '~/types'
import { describe, expect, it, vi } from 'vitest'
import { getTweets } from '~/lib/service/getTweet'

function makeTweet(partial: Partial<EnrichedTweet> & Pick<EnrichedTweet, 'id_str'>): EnrichedTweet {
  const { id_str, ...rest } = partial
  return {
    id_str,
    text: rest.text ?? '',
    lang: rest.lang ?? 'en',
    created_at: rest.created_at ?? '',
    user: (rest.user ?? { screen_name: 'u', id_str: 'u', name: 'u', profile_image_url_https: '' }) as any,
    entities: (rest.entities ?? []) as any,
    ...rest,
  } as EnrichedTweet
}

describe('getTweets', () => {
  it('fetches parent chain and attaches quoted tweet', async () => {
    const t1 = makeTweet({ id_str: '0001', text: 'root' })
    const t2 = makeTweet({ id_str: '0002', text: 'reply', in_reply_to_status_id_str: '0001', quoted_tweet_id: '0099' } as any)
    const q = makeTweet({ id_str: '0099', text: 'quoted' })

    const getter = vi.fn(async (id: string) => {
      if (id === '0002')
        return t2
      if (id === '0001')
        return t1
      if (id === '0099')
        return q
      return null
    })

    const tweets = await getTweets('0002', getter as any)

    expect(getter).toHaveBeenCalledWith('0002')
    expect(getter).toHaveBeenCalledWith('0001')
    expect(getter).toHaveBeenCalledWith('0099')
    expect(t2.quotedTweet?.id_str).toBe('0099')
    expect(tweets.map(t => t.id_str)).toEqual(['0001', '0002'])
  })
})
