import type { EnrichedTweet } from '../utils.js'
import s from './tweet-in-reply-to.module.css'

export function TweetInReplyTo({ tweet }: { tweet: EnrichedTweet }) {
  return (
    <a
      href={tweet.in_reply_to_url}
      className={s.root}
      target="_blank"
      rel="noopener noreferrer"
    >
      Replying to @
      {tweet.in_reply_to_screen_name}
    </a>
  )
}
