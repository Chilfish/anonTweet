import { writeFile } from 'node:fs/promises'
import { enrichTweet, fetchUserTweet } from '~/lib/react-tweet'
import { FetcherService, Rettiwt } from '~/lib/rettiwt-api'

import { RettiwtConfig } from '~/lib/rettiwt-api/models/RettiwtConfig'

const TWEET_KEY = typeof process !== 'undefined' ? process.env.TWEET_KEY || '' : ''

const configs = new RettiwtConfig({ apiKey: TWEET_KEY })

const fetcher = new FetcherService(configs)

const rettiwt = new Rettiwt(configs)

const user = await rettiwt.user.details('Watase_Yuzuki')

if (!user) {
  process.exit(1)
}

const userId = user.id

const tweets = await fetchUserTweet(userId)

await writeFile('data/data.json', JSON.stringify(tweets, null, 2), 'utf8')

const enrichedTweets = tweets.map(enrichTweet)

await writeFile('data/data2.json', JSON.stringify(enrichedTweets, null, 2), 'utf8')
