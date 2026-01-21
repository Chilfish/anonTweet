import type { Ref, RefObject } from 'react'
import type { AppConfigs } from '~/lib/stores/appConfig'
import type { TweetData } from '~/types'
import { useEffect, useMemo, useRef } from 'react'
import { useElementSize } from '~/hooks/use-element-size'
import { TweetContainer } from '~/lib/react-tweet'
import { organizeTweets } from '~/lib/react-tweet/utils/organizeTweets'
import {
  useIsCapturingSelected,
  useTranslationActions,
  useTranslationSettings,
  useTranslationUIActions,
} from '~/lib/stores/hooks'
import { cn } from '~/lib/utils'
import { CommentBranch } from './CommentBranch'
import { SelectableTweetWrapper } from './SelectableTweetWrapper'
import { ThreadLine } from './ThreadLine'
import { TweetNode } from './TweetNode'

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

function MainThreadLine({ mainTweetRef, visible }: {
  mainTweetRef: RefObject<HTMLDivElement | null>
  visible: boolean
}) {
  const { height } = useElementSize(mainTweetRef)
  return (
    <ThreadLine
      visible={visible}
      bottomOffset={height}
    />
  )
}

export function MyTweet({
  tweets,
  mainTweetId,
  containerClassName,
  showComments,
  filterUnrelated: propFilterUnrelated,
  excludeUsers,
}: MyTweetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { setTweetElRef } = useTranslationUIActions()
  const { setCommentIds } = useTranslationActions()
  const isCapturingSelected = useIsCapturingSelected()
  const { filterUnrelated: storeFilterUnrelated } = useTranslationSettings()

  const filterUnrelated = propFilterUnrelated ?? storeFilterUnrelated

  useEffect(() => {
    if (containerRef.current)
      setTweetElRef(containerRef.current)
  }, [setTweetElRef])

  const { mainTweet, ancestors, commentThreads } = useMemo(() => {
    return organizeTweets(tweets, mainTweetId, { showComments, filterUnrelated, excludeUsers })
  }, [tweets, mainTweetId, showComments, filterUnrelated, excludeUsers])

  useEffect(() => {
    setCommentIds(commentThreads.map(thread => thread.id_str))
  }, [commentThreads.length, setCommentIds])

  const mainTweetRef = useRef<HTMLDivElement>(null)

  if (!mainTweet)
    return null

  const hasThread = ancestors.length > 0
  const hasComments = !!(showComments && commentThreads.length)

  return (
    <TweetContainer
      ref={containerRef}
      id={mainTweet.id_str}
      className={cn('tweet-loaded', containerClassName)}
    >
      <div className="relative">
        {/* 1. 祖先节点 (Context) */}
        {hasThread && (
          <>
            {ancestors.map((parentTweet) => {
              return (
                <SelectableTweetWrapper
                  key={parentTweet.id_str}
                  tweetId={parentTweet.id_str}
                >
                  <TweetNode
                    tweet={parentTweet}
                    variant="thread"
                    hasParent={true}
                  />
                </SelectableTweetWrapper>
              )
            })}

            {/* 祖先节点到底部的连线 (只在非截图或全部显示时出现) */}
            <MainThreadLine
              mainTweetRef={mainTweetRef}
              visible={!isCapturingSelected}
            />
          </>
        )}

        {/* 2. 主推文 (Main Focus) */}
        <SelectableTweetWrapper
          tweetId={mainTweet.id_str}
          className={cn(hasComments && 'pb-4 border-b border-[#cfd9de] dark:border-[#333639]')}
        >
          <article className="relative">
            <TweetNode
              ref={mainTweetRef}
              tweet={mainTweet}
              variant={hasThread ? 'main-in-thread' : 'main'}
              hasParent={false}
            />
          </article>
        </SelectableTweetWrapper>
      </div>

      {/* 3. 评论区 (Replies) */}
      {hasComments && (
        <section>
          {commentThreads.map(thread => (
            <CommentBranch key={thread.id_str} tweet={thread} />
          ))}
        </section>
      )}
    </TweetContainer>
  )
}

MyTweet.displayName = 'MyTweet'
