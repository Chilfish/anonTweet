import type { EnrichedTweet } from '../utils.js'
import { formatDateByLang } from '../date-utils.js'
import s from './tweet-info-created-at.module.css'

export const TweetInfoCreatedAt = ({ tweet }: { tweet: EnrichedTweet }) => {
  const createdAt = new Date(tweet.created_at)
  const formattedCreatedAtDate = formatDateByLang(createdAt, tweet.lang)

  return (
    <a
      className={s.root}
      href={tweet.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={formattedCreatedAtDate}
    >
      <time dateTime={createdAt.toISOString()}>{formattedCreatedAtDate}</time>
    </a>
  )
}
