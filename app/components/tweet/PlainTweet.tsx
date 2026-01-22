import type { EnrichedTweet, TweetData } from '~/types'
import { useMemo, useRef } from 'react'
import { useElementSize } from '~/hooks/use-element-size'
import { models } from '~/lib/constants'
import {
  TweetBody,
  TweetContainer,
  TweetHeader,
  TweetMedia,
} from '~/lib/react-tweet'
import { cn } from '~/lib/utils'
import { TweetLinkCard } from './TweetCard'
import { TweetMediaAlt } from './TweetMediaAlt'

function TweetTextBody({ tweet, enableTranslation }: { tweet: EnrichedTweet, enableTranslation: boolean }) {
  const translation = enableTranslation ? tweet.autoTranslationEntities : null

  if (!translation) {
    return (<TweetBody tweet={tweet} isTranslated={false} />)
  }

  const geminiModel = typeof __GEMINI_MODEL__ === 'undefined' ? 'models/gemini-3-flash-preview' : __GEMINI_MODEL__
  const separatorTemplate = `<div style="margin-top: 4px; color: #3285FD;">
<b style="font-weight: bold; font-size: small;">由 ${models.find(m => m.name === geminiModel)?.text || 'Gemini'} 翻译</b>
<hr style="margin: 3px; border-top-width: 2px;">
</div>`

  return (
    <>
      <TweetBody tweet={tweet} isTranslated={false} />

      <div
        className="translation-separator"
        dangerouslySetInnerHTML={{ __html: separatorTemplate }}
      >
      </div>
      <TweetBody
        lang="zh"
        className="font-bold! mt-2!"
        tweet={{
          ...tweet,
          entities: translation || tweet.entities,
        }}
        isTranslated
      />
    </>
  )
}

type TweetVariant = 'thread' | 'quoted' | 'main' | 'main-in-thread'

interface UnifiedTweetProps {
  tweet: EnrichedTweet
  variant: TweetVariant
  enableTranslation: boolean
}

function UnifiedTweet({ tweet, variant, enableTranslation }: UnifiedTweetProps) {
  const isQuoted = variant === 'quoted'
  const isThread = variant === 'thread'
  const isMainInThread = variant === 'main-in-thread'

  const containerClasses = cn({
    'p-2 sm:p-4! border-2 rounded-2xl mt-2!': isQuoted,
    'border-none! px-0! py-3! relative': isThread,
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
        avatarSize={isQuoted ? 'small' : 'medium'}
      />
      <div className={bodyContainerClasses}>
        <TweetTextBody
          tweet={tweet}
          enableTranslation={enableTranslation}
        />

        {tweet.mediaDetails?.length ? (
          <TweetMedia tweet={tweet} showCoverOnly={true} />
        ) : null}

        <TweetMediaAlt tweet={tweet} />

        {tweet.card && <TweetLinkCard tweet={tweet} />}

        {quotedTweet && (
          <UnifiedTweet
            enableTranslation={enableTranslation}
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
  enableTranslation: boolean
}

export function MyPlainTweet({ tweets, mainTweetId, enableTranslation }: MyTweetProps) {
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
      id={mainTweet.id_str}
      className="tweet-loaded"
    >
      {hasThread && (
        <>
          {parentTweets.map(parentTweet => (
            <UnifiedTweet
              key={parentTweet.id_str}
              tweet={parentTweet}
              enableTranslation={enableTranslation}
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
          enableTranslation={enableTranslation}
          variant={hasThread ? 'main-in-thread' : 'main'}
        />
      </article>
    </TweetContainer>
  )
}
