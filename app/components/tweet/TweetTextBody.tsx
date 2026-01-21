import type { EnrichedTweet } from '~/types'
import { memo } from 'react'
import { TranslationDisplay } from '~/components/translation/TranslationDisplay'
import { TweetBody } from '~/lib/react-tweet'
import { useGlobalTranslationMode, useTranslations } from '~/lib/stores/hooks'

function TweetTextBodyComponent({ tweet }: { tweet: EnrichedTweet }) {
  const { translationMode, tweetTranslationModes } = useGlobalTranslationMode()
  const translations = useTranslations()

  const mode = tweetTranslationModes[tweet.id_str] || translationMode
  const hasTranslation = translations[tweet.id_str] !== undefined || !!tweet.autoTranslationEntities?.length
  const isShowRawText = mode !== 'translation' || !hasTranslation

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

export const TweetTextBody = memo(TweetTextBodyComponent)
