import type { EnrichedTweet } from '~/types'
import { TranslationDisplay } from '~/components/translation/TranslationDisplay'
import { TweetBody } from '~/lib/react-tweet'

export function TweetTextBody({ tweet }: { tweet: EnrichedTweet }) {
  return (
    <>
      {/* 原推文 */}
      <TweetBody tweet={tweet} isTranslated={false} />
      {/* 翻译显示 */}
      <TranslationDisplay
        tweetId={`${tweet.id_str}`}
        originalTweet={tweet}
      />
    </>
  )
}
