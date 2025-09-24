import type { EnrichedQuotedTweet } from '../../utils.js'
import { TweetMedia } from '../tweet-media.js'
import { QuotedTweetBody } from './quoted-tweet-body.js'
import { QuotedTweetContainer } from './quoted-tweet-container.js'
import { QuotedTweetHeader } from './quoted-tweet-header.js'

interface Props { tweet: EnrichedQuotedTweet }

export function QuotedTweet({ tweet }: Props) {
  return (
    <QuotedTweetContainer tweet={tweet}>
      <QuotedTweetHeader tweet={tweet} />
      <QuotedTweetBody tweet={tweet} />
      {tweet.mediaDetails?.length ? <TweetMedia quoted tweet={tweet} /> : null}
    </QuotedTweetContainer>
  )
}
