import type { Tweet } from '../api/index'
import type { TwitterComponents } from './types'
import { useMemo } from 'react'
import { enrichTweet } from '../utils'
import { QuotedTweet } from './quoted-tweet/index'
import { TweetActions } from './tweet-actions'
import { TweetBody } from './tweet-body'
import { TweetContainer } from './tweet-container'
import { TweetHeader } from './tweet-header'
import { TweetInReplyTo } from './tweet-in-reply-to'
import { TweetInfo } from './tweet-info'
import { TweetMedia } from './tweet-media'
import { TweetReplies } from './tweet-replies'

interface Props {
  tweet: Tweet
  components?: Omit<TwitterComponents, 'TweetNotFound'>
}

export function EmbeddedTweet({ tweet: t, components }: Props) {
  // useMemo does nothing for RSC but it helps when the component is used in the client (e.g by SWR)
  const tweet = useMemo(() => enrichTweet(t), [t])
  return (
    <TweetContainer>
      <TweetHeader tweet={tweet} components={components} />
      {tweet.in_reply_to_status_id_str && <TweetInReplyTo tweet={tweet} />}
      <TweetBody tweet={tweet} />
      {tweet.mediaDetails?.length
        ? (
            <TweetMedia tweet={tweet} components={components} />
          )
        : null}
      {tweet.quoted_tweet && <QuotedTweet tweet={tweet.quoted_tweet} />}
      <TweetInfo tweet={tweet} />
      <TweetActions tweet={tweet} />
      <TweetReplies tweet={tweet} />
    </TweetContainer>
  )
}
