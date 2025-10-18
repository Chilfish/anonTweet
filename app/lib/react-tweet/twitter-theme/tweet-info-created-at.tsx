import type { EnrichedTweet } from '~/lib/react-tweet'
import { formatDate } from '../date-utils'
import s from './tweet-info-created-at.module.css'

export function TweetInfoCreatedAt({ tweet }: { tweet: EnrichedTweet }) {
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
