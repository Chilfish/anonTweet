import type { Ref } from 'react'
import type { EnrichedTweet, TwitterComponents } from '~/lib/react-tweet'
import type { TweetData } from '~/types'
import {
  TweetActions,
  TweetContainer,
  TweetHeader,
  TweetInfo,
  TweetMedia,
} from '~/lib/react-tweet'
import { TranslationEditor } from '../TranslationEditor'
import { TweetLinkCard } from './TweetCard'
import { TweetTextBody } from './TweetTextBody'

interface TweetComponentProps extends TweetData {
  tweet: EnrichedTweet
  components?: TwitterComponents
  showMp4CoverOnly?: boolean
  ref?: Ref<HTMLDivElement>
}

const hasMedia = (tweet: EnrichedTweet) => tweet.photos?.length || !!tweet.video?.videoId

function ThreadTweet({ tweet, components, showMp4CoverOnly }: TweetComponentProps) {
  const quotedTweet = tweet.quoted_tweet
  return (
    <TweetContainer
      className="border-none! p-0! m-0! pb-2! relative"
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
        {/* Thread 的那根对齐头像的竖线 */}
        <div className="absolute left-5.5 top-12 bottom-0 h-full w-[2px] bg-[#cfd9de] dark:bg-[#333639] z-0"></div>

        <TweetTextBody tweet={tweet} />

        {tweet.mediaDetails?.length
          ? (
              <TweetMedia tweet={tweet} components={components} showCoverOnly={showMp4CoverOnly} />
            )
          : null}

        {tweet.card && <TweetLinkCard tweet={tweet} />}

        {quotedTweet && <QuotedTweet tweet={quotedTweet as any} showMp4CoverOnly={showMp4CoverOnly} />}

        <TweetActions
          tweet={tweet}
          className="mt-2 gap-12!"
        />

      </div>
    </TweetContainer>
  )
}

function QuotedTweet({ tweet, showMp4CoverOnly }: { tweet: EnrichedTweet, showMp4CoverOnly?: boolean }) {
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

export function MyTweet({ tweet, parentTweets = [], quotedTweet, components, showMp4CoverOnly, ref }: TweetComponentProps) {
  return (
    <TweetContainer ref={ref}>
      {parentTweets.map(parentTweet => (
        <ThreadTweet
          key={parentTweet.id_str}
          tweet={parentTweet}
          quotedTweet={null}
          parentTweets={[]}
          components={components}
        />
      ))}

      <div
        className="flex items-center justify-between"
      >
        <TweetHeader
          tweet={tweet}
          components={components}
        />
        <TranslationEditor originalTweet={tweet} />
      </div>

      <TweetTextBody tweet={tweet} />

      {tweet.mediaDetails?.length
        ? (
            <TweetMedia tweet={tweet} components={components} showCoverOnly={showMp4CoverOnly} />
          )
        : null}

      {tweet.card && <TweetLinkCard tweet={tweet} />}

      {quotedTweet && <QuotedTweet tweet={quotedTweet} showMp4CoverOnly={showMp4CoverOnly} />}

      <div className="flex items-center gap-3 pt-2">
        <TweetInfo tweet={tweet} />
        <TweetActions tweet={tweet} />
      </div>
    </TweetContainer>
  )
}
