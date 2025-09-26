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

/**
 * 如果是 Thread （查看的是评论）：
 *  - 显示被回复的推文、评论的推文
 *  - 头像之间有竖线、源推文除了 header 有 padding
 *
 * 条件：
 *  - 推文有 parent 且 parent 是 Tweet
 *  - 推文的 in_reply_to_user_id_str 与 parent 的 user.id_str 相等
 */

function ThreadTweet({ tweet, components, showMp4CoverOnly }: TweetComponentProps) {
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

        <TweetActions
          tweet={tweet}
          className="mt-2 gap-12!"
        />

      </div>
    </TweetContainer>
  )
}

export function MyTweet({ tweet, parentTweets = [], quotedTweet, components, showMp4CoverOnly, ref }: TweetComponentProps) {
  const hasMedia = (tweet: EnrichedTweet) => tweet.photos?.length || !!tweet.video?.videoId
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

      {quotedTweet && (
        <div className="p-4! border-2 rounded-2xl mt-2!">
          <div
            className="flex items-center justify-between"
          >
            <TweetHeader
              tweet={quotedTweet as any}
              components={components}
              createdAtInline
            />
            <TranslationEditor
              originalTweet={quotedTweet}
            />
          </div>

          <TweetTextBody tweet={quotedTweet} />

          {hasMedia(quotedTweet)
            && (
              <TweetMedia
                tweet={quotedTweet}
                components={components}
                showCoverOnly={showMp4CoverOnly}
              />
            )}

          {quotedTweet.card && <TweetLinkCard tweet={quotedTweet} />}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <TweetInfo tweet={tweet} />
        <TweetActions tweet={tweet} />
      </div>
    </TweetContainer>
  )
}
