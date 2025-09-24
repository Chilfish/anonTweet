import type { EnrichedTweet } from '../utils.js'
import { formatNumber } from '../utils.js'
import s from './tweet-replies.module.css'

export function TweetReplies({ tweet }: { tweet: EnrichedTweet }) {
  return (
    <div className={s.replies}>
      <a
        className={s.link}
        href={tweet.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={s.text}>
          {tweet.conversation_count === 0
            ? 'Read more on X'
            : tweet.conversation_count === 1
              ? `Read ${formatNumber(tweet.conversation_count)} reply`
              : `Read ${formatNumber(tweet.conversation_count)} replies`}
        </span>
      </a>
    </div>
  )
}
