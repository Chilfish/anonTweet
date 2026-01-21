import type { EnrichedTweet } from '~/types'
import { memo } from 'react'
import { formatDate } from '../utils'
import s from './tweet-info-created-at.module.css'

function TweetInfoCreatedAtComponent({ tweet }: { tweet: EnrichedTweet }) {
  const createdAt = new Date(tweet.created_at)
  const formattedCreatedAtDate = formatDate(createdAt)

  return (
    <a
      className={s.root}
      href={tweet.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={formattedCreatedAtDate}
    >
      <time
        suppressHydrationWarning={true}
        dateTime={createdAt.toISOString()}
      >
        {formattedCreatedAtDate}
      </time>
    </a>
  )
}

export const TweetInfoCreatedAt = memo(TweetInfoCreatedAtComponent)
