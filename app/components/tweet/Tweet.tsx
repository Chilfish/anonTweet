import type { Ref } from 'react'
import type { EnrichedTweet, TwitterComponents } from '~/lib/react-tweet'
import type { ThemeSettings } from '~/lib/stores/theme'
import type { TweetData } from '~/types'
import { useEffect, useRef, useState } from 'react'
import {
  TweetContainer,
  TweetHeader,
  TweetMedia,
} from '~/lib/react-tweet'
import { cn } from '~/lib/utils'
import { TranslationEditor } from '../TranslationEditor'
import { TweetLinkCard } from './TweetCard'
import { TweetTextBody } from './TweetTextBody'

interface TweetComponentProps extends TweetData {
  tweet: EnrichedTweet
  components?: TwitterComponents
  settings?: ThemeSettings
  showMp4CoverOnly?: boolean
  ref?: Ref<HTMLDivElement>
}

const hasMedia = (tweet: EnrichedTweet) => tweet.photos?.length || !!tweet.video?.videoId

function ThreadTweet({
  tweet,
  components,
  showMp4CoverOnly,
}: TweetComponentProps) {
  const quotedTweet = tweet.quoted_tweet || null
  return (
    <TweetContainer
      className="border-none! px-0! py-2! relative"
    >
      <div
        className="flex items-center justify-between"
      >
        <TweetHeader
          tweet={tweet}
          components={components}
          className="pb-1!"
          createdAtInline
        />
        <TranslationEditor originalTweet={tweet} />
      </div>
      <div
        className="pl-14!"
      >
        <TweetBody
          tweet={tweet}
          quotedTweet={quotedTweet as any}
          showMp4CoverOnly={showMp4CoverOnly}
          parentTweets={[]}
        />
      </div>
    </TweetContainer>
  )
}

function TweetBody({ tweet, quotedTweet, showMp4CoverOnly }: TweetComponentProps) {
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
  tweet,
  parentTweets = [],
  quotedTweet,
  components,
  showMp4CoverOnly,
  ref,
}: TweetComponentProps) {
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
              quotedTweet={null}
              parentTweets={[]}
              components={components}
              showMp4CoverOnly={showMp4CoverOnly}
            />
          ))}

          {/* Thread 的那根对齐头像的竖线 */}
          <div
            style={{
              height: `calc(100% - ${mainTweetheight}px)`,
            }}
            className="absolute z-0 left-5.5 top-4 bottom-0 w-[2px] bg-[#cfd9de] dark:bg-[#333639]"
          >
          </div>
        </>
      )}

      <article
        ref={mainTweetRef}
      >
        <div className="flex items-center justify-between">
          <TweetHeader tweet={tweet} components={components} createdAtInline />
          <TranslationEditor originalTweet={tweet} />
        </div>

        <div
          className={cn({ 'pl-14!': hasThread })}
        >
          <TweetBody
            tweet={tweet}
            quotedTweet={quotedTweet as any}
            showMp4CoverOnly={showMp4CoverOnly}
            parentTweets={[]}
          />
        </div>
      </article>
    </TweetContainer>
  )
}
