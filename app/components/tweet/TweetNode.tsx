import type { EnrichedTweet } from '~/types'
import { forwardRef, memo } from 'react'
import { TranslationEditor } from '~/components/translation/TranslationEditor'
import { TweetHeader, TweetMedia } from '~/lib/react-tweet'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useScreenshoting } from '~/lib/stores/hooks'
import { cn } from '~/lib/utils'
import { TweetLinkCard } from './TweetCard'
import { TweetMediaAlt } from './TweetMediaAlt'
import { TweetTextBody } from './TweetTextBody'

export type TweetVariant = 'thread' | 'quoted' | 'main' | 'main-in-thread'

interface TweetNodeProps {
  tweet: EnrichedTweet
  variant: TweetVariant
  hasParent?: boolean
}

export const TweetNode = memo(forwardRef<HTMLDivElement, TweetNodeProps>(({
  tweet,
  variant,
  hasParent,
}, ref) => {
  const screenshoting = useScreenshoting()
  const isInlineMedia = useAppConfigStore(state => state.isInlineMedia)

  const isQuoted = variant === 'quoted'
  const isThreadContext = variant === 'thread' || variant === 'main-in-thread'
  const avatarSize = isThreadContext ? 'small' : 'medium'

  // 样式映射表，替代混乱的 cn
  const styles = {
    container: cn('relative', {
      'p-3 border-2 rounded-2xl mt-2': isQuoted,
      'pb-3': hasParent, // 原 isParentTweet
    }),
    body: cn({ 'pl-12': isThreadContext }),
    header: cn({ 'pb-1': variant === 'thread' }),
  }

  return (
    <div ref={ref} className={styles.container}>
      <TweetHeader
        tweet={tweet}
        className={styles.header}
        createdAtInline
        avatarSize={avatarSize}
      />

      <TranslationEditor originalTweet={tweet} className="absolute top-2 right-1" />

      <div className={styles.body}>
        <TweetTextBody tweet={tweet} />

        {(tweet.mediaDetails || []).length > 0 && (
          <TweetMedia
            tweet={{ ...tweet, isInlineMeida: isInlineMedia || tweet.isInlineMeida }}
            showCoverOnly={screenshoting}
          />
        )}

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
}))

TweetNode.displayName = 'TweetNode'
