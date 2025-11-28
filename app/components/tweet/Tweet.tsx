import type { Ref } from 'react'
import type { EnrichedTweet } from '~/lib/react-tweet'
import type { ThemeSettings } from '~/lib/stores/theme'
import type { TweetData } from '~/types'
import { useEffect, useRef, useState } from 'react'
import { TranslationEditor } from '~/components/translation/TranslationEditor'
import {
  TweetContainer,
  TweetHeader,
  TweetMedia,
} from '~/lib/react-tweet'
import { useTranslationStore } from '~/lib/stores/translation'
import { cn } from '~/lib/utils'
import { TweetLinkCard } from './TweetCard'
import { TweetTextBody } from './TweetTextBody'

interface TweetComponentProps {
  tweets: TweetData
  mainTweetId: string
  settings?: ThemeSettings
  showMp4CoverOnly?: boolean
  ref?: Ref<HTMLDivElement>
}

const hasMedia = (tweet: EnrichedTweet) => !!tweet.mediaDetails?.length

function ThreadTweet({
  tweet,
  showMp4CoverOnly,
}: {
  tweet: EnrichedTweet
  showMp4CoverOnly?: boolean
}) {
  return (
    <TweetContainer
      className="border-none! px-0! py-2! relative"
    >
      <div
        className="flex items-center justify-between"
      >
        <TweetHeader
          tweet={tweet}
          className="pb-1!"
          createdAtInline
        />
        <TranslationEditor originalTweet={tweet} />
      </div>
      <div
        className="sm:pl-14! pl-12!"
      >
        <TweetBody
          tweet={tweet}
          showMp4CoverOnly={showMp4CoverOnly}
        />
      </div>
    </TweetContainer>
  )
}

function TweetBody({ tweet, showMp4CoverOnly }: {
  tweet: EnrichedTweet
  showMp4CoverOnly?: boolean
}) {
  const quotedTweet = tweet.quotedTweet || null
  return (
    <>
      <TweetTextBody tweet={tweet} />

      {tweet.mediaDetails?.length
        ? (
            <TweetMedia
              tweet={tweet}
              showCoverOnly={showMp4CoverOnly}
            />
          )
        : null}

      {tweet.card && <TweetLinkCard tweet={tweet} />}

      {quotedTweet && (
        <QuotedTweet
          tweet={quotedTweet as any}
          showMp4CoverOnly={showMp4CoverOnly}
        />
      )}
    </>
  )
}

function QuotedTweet({
  tweet,
  showMp4CoverOnly,
}: { tweet: EnrichedTweet, showMp4CoverOnly?: boolean }) {
  return (
    <div className="p-4! border-2 rounded-2xl mt-2!">
      <div
        className="flex items-center justify-between"
      >
        <TweetHeader
          tweet={tweet}
          createdAtInline
        />
        <TranslationEditor
          originalTweet={tweet}
        />
      </div>

      <TweetTextBody tweet={tweet} />

      {hasMedia(tweet)
        && (
          <TweetMedia
            tweet={tweet}
            showCoverOnly={showMp4CoverOnly}
          />
        )}

      {tweet.card && <TweetLinkCard tweet={tweet} />}
    </div>
  )
}

export function MyTweet({
  tweets,
  mainTweetId,
  showMp4CoverOnly,
}: TweetComponentProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const { setTweetElRef } = useTranslationStore()

  useEffect(() => {
    if (ref.current) {
      setTweetElRef(ref.current)
    }
  }, [ref.current])

  const mainTweet = tweets.find(tweet => tweet.id_str === mainTweetId)!
  const parentTweets = tweets.filter(tweet => tweet.id_str !== mainTweetId)

  const hasThread = parentTweets.length > 0
  const mainTweetRef = useRef<HTMLElement | null>(null)
  const [mainTweetheight, setMainTweetHeight] = useState(0)

  useEffect(() => {
    if (!mainTweetRef.current) {
      return
    }
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === mainTweetRef.current) {
          setMainTweetHeight(entry.contentRect.height)
        }
      }
    })

    resizeObserver.observe(mainTweetRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <TweetContainer ref={ref}>
      {hasThread && (
        <>
          {parentTweets.map(parentTweet => (
            <ThreadTweet
              key={parentTweet.id_str}
              tweet={parentTweet}
              showMp4CoverOnly={showMp4CoverOnly}
            />
          ))}

          {/* Thread 的那根对齐头像的竖线 */}
          <div
            style={{
              height: `calc(100% - ${mainTweetheight}px)`,
            }}
            className="absolute z-0 left-[1.1rem] sm:left-[1.3rem] top-4 bottom-0 w-[2px] bg-[#cfd9de] dark:bg-[#333639]"
          >
          </div>
        </>
      )}

      <article
        ref={mainTweetRef}
      >
        <div className="flex items-center justify-between">
          <TweetHeader tweet={mainTweet} createdAtInline />
          <TranslationEditor originalTweet={mainTweet} />
        </div>

        <div
          className={cn({ 'sm:pl-14! pl-12!': hasThread })}
        >
          <TweetBody
            tweet={mainTweet}
            showMp4CoverOnly={showMp4CoverOnly}
          />
        </div>
      </article>
    </TweetContainer>
  )
}
