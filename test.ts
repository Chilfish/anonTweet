import { writeFile } from 'node:fs/promises'
import { enrichTweet } from '~/lib/react-tweet/api-v2/parseTweet'
import tweetData from './data/tweet.json'

// const tweetDetail = await fetchTweet('1979560868217336063')

// await writeFile('./data/tweet.json', JSON.stringify(tweetDetail, null, 2))

const enrichedTweet = enrichTweet(tweetData as any)

await writeFile('./data/tweet-enriched.json', JSON.stringify(enrichedTweet, null, 2))
