import type { EnrichedTweet } from '~/types'
import React from 'react'
import { useTweetTranslation } from '~/hooks/use-tweet-translation'
import { TweetBody } from '~/lib/react-tweet/twitter-theme/tweet-body'
import { useTranslationSettings } from '~/lib/stores/hooks'

interface TranslationDisplayProps {
  tweetId: string
  originalTweet: EnrichedTweet
}

export const TranslationDisplay: React.FC<TranslationDisplayProps> = ({
  tweetId,
  originalTweet,
}) => {
  const settings = useTranslationSettings()
  const { shouldShow, entities } = useTweetTranslation(originalTweet, 'body')

  if (!shouldShow || !entities) {
    return null
  }

  return (
    <>
      <div
        className="translation-separator"
        dangerouslySetInnerHTML={{ __html: settings.customSeparator }}
      >
      </div>
      <TweetBody
        lang="zh"
        className="font-bold! mt-2!"
        tweet={{
          ...originalTweet,
          entities,
        }}
        isTranslated
      />
    </>
  )
}
