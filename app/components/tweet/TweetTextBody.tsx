import type { EnrichedTweet } from '~/types'
import { TranslationDisplay } from '~/components/translation/TranslationDisplay'
import { useTweetTranslation } from '~/hooks/use-tweet-translation'
import { TweetBody } from '~/lib/react-tweet'
import { useGlobalTranslationMode } from '~/lib/stores/hooks'

export function TweetTextBody({ tweet }: { tweet: EnrichedTweet }) {
  const { translationMode, tweetTranslationModes } = useGlobalTranslationMode()
  const { shouldShow } = useTweetTranslation(tweet, 'body')

  const mode = tweetTranslationModes[tweet.id_str] || translationMode
  const isShowRawText = mode !== 'translation' || !shouldShow

  return (
    <>
      {/* 原推文 */}
      {isShowRawText && <TweetBody tweet={tweet} isTranslated={false} />}
      {/* 翻译显示 */}
      <TranslationDisplay
        tweetId={`${tweet.id_str}`}
        originalTweet={tweet}
      />
    </>
  )
}

// export const TweetTextBody = memo(TweetTextBodyComponent)
