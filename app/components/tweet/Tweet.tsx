import type { Ref } from 'react'
import type { AppConfigs } from '~/lib/stores/appConfig'
import type { EnrichedTweet, TweetData } from '~/types'
import { useEffect, useMemo, useRef } from 'react'
import { TranslationEditor } from '~/components/translation/TranslationEditor'
import { useElementSize } from '~/hooks/use-element-size'
import {
  TweetContainer,
  TweetHeader,
  TweetMedia,
} from '~/lib/react-tweet'
import { useTranslationStore } from '~/lib/stores/translation'
import { cn } from '~/lib/utils'
import { TweetLinkCard } from './TweetCard'
import { TweetTextBody } from './TweetTextBody'

type TweetVariant = 'thread' | 'quoted' | 'main' | 'main-in-thread'

interface UnifiedTweetProps {
  tweet: EnrichedTweet
  variant: TweetVariant
}

function UnifiedTweet({ tweet, variant }: UnifiedTweetProps) {
  const { screenshoting } = useTranslationStore()
  const isQuoted = variant === 'quoted'
  const isThread = variant === 'thread'
  const isMainInThread = variant === 'main-in-thread'

  const containerClasses = cn({
    'p-2 sm:p-4! border-2 rounded-2xl mt-2!': isQuoted,
    'border-none! px-0! py-2! relative': isThread,
  })

  const bodyContainerClasses = cn({
    'pl-12!': isThread || isMainInThread,
  })

  const quotedTweet = tweet.quotedTweet

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between">
        <TweetHeader
          tweet={tweet}
          className={cn({ 'pb-1!': isThread })}
          createdAtInline
          inQuote={isQuoted}
        />
        <TranslationEditor originalTweet={tweet} />
      </div>
      <div className={bodyContainerClasses}>
        <TweetTextBody tweet={tweet} />

        {tweet.mediaDetails?.length ? (
          <TweetMedia tweet={tweet} showCoverOnly={screenshoting} />
        ) : null}

        {tweet.card && <TweetLinkCard tweet={tweet} />}

        {quotedTweet && (
          <UnifiedTweet
            tweet={quotedTweet}
            variant="quoted"
          />
        )}
      </div>
    </div>
  )
}

interface MyTweetProps {
  tweets: TweetData
  mainTweetId: string
  containerClassName?: string
  settings?: AppConfigs
  ref?: Ref<HTMLDivElement>
}

export function MyTweet({ tweets, mainTweetId, containerClassName }: MyTweetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { setTweetElRef } = useTranslationStore()

  useEffect(() => {
    if (containerRef.current) {
      setTweetElRef(containerRef.current)
    }
  }, [setTweetElRef])

  const { mainTweet, parentTweets } = useMemo(() => {
    const main = tweets.find(tweet => tweet.id_str === mainTweetId)
    if (!main) {
      return { mainTweet: null, parentTweets: [] }
    }
    const parents = tweets.filter(tweet => tweet.id_str !== mainTweetId)
    return { mainTweet: main, parentTweets: parents }
  }, [tweets, mainTweetId])

  const hasThread = parentTweets.length > 0
  const mainTweetRef = useRef<HTMLDivElement | null>(null)

  const { height: mainTweetHeight } = useElementSize(mainTweetRef)

  if (!mainTweet) {
    return null
  }

  return (
    <TweetContainer
      ref={containerRef}
      id={mainTweet.id_str}
      className={cn('tweet-loaded', containerClassName)}
    >
      {hasThread && (
        <>
          {parentTweets.map(parentTweet => (
            <UnifiedTweet
              key={parentTweet.id_str}
              tweet={parentTweet}
              variant="thread"
            />
          ))}

          <div
            style={{
              height: mainTweetHeight > 0 ? `calc(100% - ${mainTweetHeight}px)` : '100%',
            }}
            className="absolute z-0 left-[1.1rem] sm:left-[1.3rem] top-4 bottom-0 w-[2px] bg-[#cfd9de] dark:bg-[#333639]"
          />
        </>
      )}

      <article ref={mainTweetRef}>
        <UnifiedTweet
          tweet={mainTweet}
          variant={hasThread ? 'main-in-thread' : 'main'}
        />
      </article>
    </TweetContainer>
  )
}
