import type { EnrichedTweet } from '~/lib/react-tweet'
import { TweetMedia } from '../tweet-media'
import { QuotedTweetBody } from './quoted-tweet-body'
import { QuotedTweetContainer } from './quoted-tweet-container'
import { QuotedTweetHeader } from './quoted-tweet-header'

interface Props { tweet: EnrichedTweet }

export function QuotedTweet({ tweet }: Props) {
  return (
    <QuotedTweetContainer tweet={tweet}>
      <QuotedTweetHeader tweet={tweet} />
      <QuotedTweetBody tweet={tweet} />
      {tweet.mediaDetails?.length ? <TweetMedia quoted tweet={tweet} /> : null}
    </QuotedTweetContainer>
  )
}
