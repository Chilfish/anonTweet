import type { ITweetRepliesResponse } from '~/lib/rettiwt-api/types/raw/tweet/Replies'
import type { EnrichedTweet } from '~/types'
import { writeFile } from 'node:fs/promises'
import { enrichTweet } from '~/lib/react-tweet'
import { ResourceType, TweetRepliesSortType } from '~/lib/rettiwt-api'
import { RettiwtPool } from '~/lib/SmartPool'

const KEYS = (typeof process === 'undefined' ? '' : process.env.TWEET_KEYS || '').split(',').filter(Boolean)

// 初始化单例池
export const twitterPool = new RettiwtPool(KEYS)

const id = '1900421155305242975'

const tweet = await twitterPool.run(async (fetcher) => {
  const response = await fetcher.request<ITweetRepliesResponse>(
    ResourceType.TWEET_REPLIES,
    {
      id,
      sortBy: TweetRepliesSortType.LIKES,
    },
  )

  const data = response.data
    .threaded_conversation_with_injections_v2
    .instructions
    .filter(t => t.type === 'TimelineAddEntries')
  const mainTweet = data.flatMap(d => d.entries?.filter(e => e.content.entryType === 'TimelineTimelineItem') || [])
    .flatMap(entry => (entry.content.itemContent?.tweet_results.result))
    .filter(result => !!result)
    .map(result => enrichTweet(result as any))
    .at(0)

  const comments = data.flatMap(t => t.entries?.filter(d => d.content.entryType === 'TimelineTimelineModule') || [])
    .flatMap(entry => (entry.content.items || []).map(d => d.item.itemContent.tweet_results.result))
    .filter(result => !!result)
    .map(result => enrichTweet(result as any))

  if (mainTweet) {
    mainTweet.comments = comments
  }

  return mainTweet || {} as EnrichedTweet
})

await writeFile('tmp/replies.json', JSON.stringify(tweet, null, 2))
