import type { EnrichedTweet } from '~/types'
import { TranslationDisplay } from '~/components/translation/TranslationDisplay'
import { TweetBody } from '~/lib/react-tweet'
import { useTranslationStore } from '~/lib/stores/translation'

export function TweetTextBody({ tweet }: { tweet: EnrichedTweet }) {
  const { translationMode, translations } = useTranslationStore()
  const hasTranslation = translations[tweet.id_str] !== undefined || !!tweet.autoTranslationEntities?.length
  const isShowRawText = translationMode !== 'translation' || !hasTranslation

  // console.log(translationMode, hasTranslation)

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
