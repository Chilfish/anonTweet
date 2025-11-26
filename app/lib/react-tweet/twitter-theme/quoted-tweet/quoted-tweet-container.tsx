import type { ReactNode } from 'react'
import type { EnrichedTweet } from '~/lib/react-tweet'
import s from './quoted-tweet-container.module.css'

interface Props { tweet: EnrichedTweet, children: ReactNode }

export function QuotedTweetContainer({ tweet, children }: Props) {
  return (
    <div
      className={s.root}
      onClick={(e) => {
        e.preventDefault()
        window.open(tweet.url, '_blank')
      }}
    >
      <article className={s.article}>{children}</article>
    </div>
  )
}
