import type { EnrichedQuotedTweet } from '../../utils.js'
import s from './quoted-tweet-body.module.css'

interface Props { tweet: EnrichedQuotedTweet }

export function QuotedTweetBody({ tweet }: Props) {
  return (
    <p className={s.root} lang={tweet.lang} dir="auto">
      {tweet.entities.map((item, i) => (
        <span key={i} dangerouslySetInnerHTML={{ __html: item.text }} />
      ))}
    </p>
  )
}
