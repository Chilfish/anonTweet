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
import { organizeTweets } from '~/lib/react-tweet/utils/organizeTweets'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationStore } from '~/lib/stores/translation'
import { cn } from '~/lib/utils'
import { TweetLinkCard } from './TweetCard'
import { TweetMediaAlt } from './TweetMediaAlt'

import { TweetTextBody } from './TweetTextBody'

type TweetVariant = 'thread' | 'quoted' | 'main' | 'main-in-thread'

interface UnifiedTweetProps {
  tweet: EnrichedTweet
  variant: TweetVariant
  isParentTweet: boolean
}

function UnifiedTweet({ tweet, variant, isParentTweet }: UnifiedTweetProps) {
  const { screenshoting } = useTranslationStore()
  const { isInlineMedia } = useAppConfigStore()
  const isQuoted = variant === 'quoted'
  const isThread = variant === 'thread'
  const isMainInThread = variant === 'main-in-thread'

  const containerClasses = cn({
    'p-3 border-2 rounded-2xl mt-2!': isQuoted,
    'relative': isThread,
    'pb-3!': isParentTweet,
  })

  const bodyContainerClasses = cn({
    'pl-12!': isThread || isMainInThread,
  })

  const quotedTweet = tweet.quotedTweet

  return (
    <div className={cn(containerClasses, 'relative')}>
      <TweetHeader
        tweet={tweet}
        className={cn({ 'pb-1!': isThread })}
        createdAtInline
        inQuote={isQuoted}
      />
      <TranslationEditor
        originalTweet={tweet}
        className="absolute top-2 right-1"
      />
      <div className={bodyContainerClasses}>
        <TweetTextBody tweet={tweet} />

        {tweet.mediaDetails?.length ? (
          <TweetMedia
            tweet={{
              ...tweet,
              isInlineMeida: isInlineMedia || tweet.isInlineMeida,
            }}
            showCoverOnly={screenshoting}
          />
        ) : null}

        <TweetMediaAlt tweet={tweet} />

        {tweet.card && <TweetLinkCard tweet={tweet} />}

        {quotedTweet && (
          <UnifiedTweet
            isParentTweet={false}
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
  showComments?: boolean
  filterUnrelated?: boolean
  excludeUsers?: string[]
}

function TweetComment({ tweet, isParentTweet }: { tweet: EnrichedTweet, isParentTweet?: boolean }) {
  const replies = tweet.comments || []
  const hasReplies = replies.length > 0

  const mainTweetRef = useRef<HTMLDivElement | null>(null)
  const { height: mainTweetHeight } = useElementSize(mainTweetRef)

  const commentsRef = useRef<HTMLDivElement | null>(null)
  const { height: commentsHeight } = useElementSize(commentsRef)

  return (
    <div
      className={cn(
        'border-b border-[#cfd9de]/30 py-2 last:border-b-0 dark:border-[#333639]/30',
        {
          relative: isParentTweet,
        },
      )}
    >
      <div
        style={{
          height: mainTweetHeight > 0 ? `calc(100% - ${mainTweetHeight}px - ${commentsHeight}px)` : 'calc(100% - 3rem)',
        }}
        className="absolute z-0 left-[1.1rem] top-4 w-[2px] bg-[#cfd9de] sm:left-[1.3rem] dark:bg-[#333639]"
      />
      <div
        ref={mainTweetRef}
      >
        <UnifiedTweet
          tweet={tweet}
          variant={hasReplies ? 'thread' : 'main-in-thread'}
          isParentTweet={hasReplies}
        />
      </div>

      <div
        ref={commentsRef}
      >
        {hasReplies && replies.map(reply => (
          <TweetComment key={reply.id_str} tweet={reply} />
        ))}
      </div>
    </div>
  )
}

export function MyTweet({
  tweets,
  mainTweetId,
  containerClassName,
  showComments,
  filterUnrelated,
  excludeUsers,
}: MyTweetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { setTweetElRef } = useTranslationStore()

  useEffect(() => {
    if (containerRef.current) {
      setTweetElRef(containerRef.current)
    }
  }, [setTweetElRef])

  const { mainTweet, ancestors: parentTweets, commentThreads } = useMemo(() => {
    return organizeTweets(tweets, mainTweetId, {
      showComments,
      filterUnrelated,
      excludeUsers,
    })
  }, [tweets, mainTweetId, showComments, filterUnrelated, excludeUsers])

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
      <div className="relative">
        {hasThread && (
          <>
            {parentTweets.map(parentTweet => (
              <UnifiedTweet
                key={parentTweet.id_str}
                tweet={parentTweet}
                isParentTweet={true}
                variant="thread"
              />
            ))}

            <div
              style={{
                height: mainTweetHeight > 0 ? `calc(100% - ${mainTweetHeight}px - 1rem)` : 'calc(100% - 3rem)',
              }}
              className="absolute z-0 left-[1.1rem] sm:left-[1.3rem] top-4 w-[2px] bg-[#cfd9de] dark:bg-[#333639]"
            />
          </>
        )}

        <article ref={mainTweetRef}>
          <UnifiedTweet
            isParentTweet={false}
            tweet={mainTweet}
            variant={hasThread ? 'main-in-thread' : 'main'}
          />
        </article>
      </div>

      {showComments && commentThreads.length > 0 && (
        <div className="mt-4 border-t border-[#cfd9de] dark:border-[#333639] pt-2">
          {commentThreads.map(thread => (
            <TweetComment key={thread.id_str} tweet={thread} isParentTweet={true} />
          ))}
        </div>
      )}
    </TweetContainer>
  )
}
