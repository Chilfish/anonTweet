import type { EnrichedQuotedTweet, EnrichedTweet } from '~/lib/react-tweet'
import { TweetBody } from '~/lib/react-tweet'
import { TranslationDisplay } from '../TranslationDisplay'

export function TweetTextBody({ tweet }: { tweet: EnrichedTweet | EnrichedQuotedTweet }) {
  return (
    <>
      {/* 原推文 */}
      <TweetBody tweet={tweet} />
      {/* 翻译显示 */}
      <TranslationDisplay tweetId={`${tweet.id_str}`} originalTweet={tweet} />
    </>
  )
}
