import type { EnrichedTweet } from '~/types'
import { formatDate } from '../utils'

export function TweetInfoCreatedAt({ tweet }: { tweet: EnrichedTweet }) {
  const createdAt = new Date(tweet.created_at)
  const formattedCreatedAtDate = formatDate(createdAt)

  return (
    <a
      className="text-inherit no-underline hover:underline decoration-1"
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
