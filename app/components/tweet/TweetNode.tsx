import type { EnrichedTweet } from '~/types'
import { Repeat2Icon } from 'lucide-react'
import { forwardRef, useMemo } from 'react'
import { TranslationEditor } from '~/components/translation/TranslationEditor'
import { formatDate, TweetHeader, TweetMedia } from '~/lib/react-tweet'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useScreenshoting } from '~/lib/stores/hooks'
import { cn, pubTime } from '~/lib/utils'
import { TweetLinkCard } from './TweetCard'
import { TweetMediaAlt } from './TweetMediaAlt'
import { TweetTextBody } from './TweetTextBody'

export type TweetVariant = 'thread' | 'quoted' | 'main' | 'main-in-thread'

interface TweetNodeProps {
  tweet: EnrichedTweet
  variant: TweetVariant
  hasParent?: boolean
}

function TweetMediaSection({ tweet }: { tweet: EnrichedTweet }) {
  const screenshoting = useScreenshoting()
  const isInlineMedia = useAppConfigStore(state => state.isInlineMedia)

  const tweetWithMediaConfig = useMemo(() => ({
    ...tweet,
    isInlineMeida: isInlineMedia || tweet.isInlineMeida,
  }), [tweet, isInlineMedia])

  if (!(tweet.mediaDetails || []).length)
    return null

  return (
    <TweetMedia
      tweet={tweetWithMediaConfig}
      showCoverOnly={screenshoting}
    />
  )
}

export const TweetNode = forwardRef<HTMLDivElement, TweetNodeProps>(({
  tweet,
  variant,
  hasParent,
}, ref) => {
  const isQuoted = variant === 'quoted'
  const isThreadContext = variant === 'thread' || variant === 'main-in-thread'
  const avatarSize = isThreadContext ? 'small' : 'medium'

  // 样式映射表，替代混乱的 cn
  const styles = useMemo(() => ({
    container: cn('relative', {
      'p-3 border-2 rounded-2xl mt-2': isQuoted,
      'pb-3': hasParent, // 原 isParentTweet
    }),
    body: cn({ 'pl-12': isThreadContext }),
    header: cn({ 'pb-1': variant === 'thread' }),
  }), [isQuoted, hasParent, isThreadContext, variant])

  const retweetedId = tweet.retweetedOrignalId

  return (
    <div ref={ref} className={styles.container}>
      {
        retweetedId && (
          <a
            className="pl-1 pb-2 flex items-center text-muted-foreground font-semibold hover:text-primary/80"
            href={`https://x.com/${tweet.user.screen_name}/status/${retweetedId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Repeat2Icon className="size-4 mr-1" />
            转推于
            {' '}
            {formatDate(pubTime(retweetedId))}
          </a>
        )
      }

      <TweetHeader
        tweet={tweet}
        className={styles.header}
        createdAtInline
        avatarSize={avatarSize}
      />

      <TranslationEditor originalTweet={tweet} className="absolute top-2 right-1" />

      <div className={styles.body}>
        <TweetTextBody tweet={tweet} />

        <TweetMediaSection tweet={tweet} />

        <TweetMediaAlt tweet={tweet} />
        {tweet.card && <TweetLinkCard tweet={tweet} />}

        {tweet.quotedTweet && (
          <TweetNode
            tweet={tweet.quotedTweet}
            variant="quoted"
            hasParent={false}
          />
        )}
      </div>
    </div>
  )
})

TweetNode.displayName = 'TweetNode'
