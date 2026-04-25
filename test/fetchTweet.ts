import { getTweets } from '../app/lib/service/getTweet'

const tweet = await getTweets('2047850803839537342')

console.log(tweet)
