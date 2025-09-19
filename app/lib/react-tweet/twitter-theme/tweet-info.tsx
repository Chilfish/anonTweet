import type { EnrichedTweet } from '../utils.js'
import { TweetInfoCreatedAt } from './tweet-info-created-at.js'
import s from './tweet-info.module.css'

export const TweetInfo = ({ tweet }: { tweet: EnrichedTweet }) => (
  <div className={s.info}>
    <TweetInfoCreatedAt tweet={tweet} />
  </div>
)
