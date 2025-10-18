import type { ILimitedVisibilityTweet } from '../base/LimitedVisibilityTweet'
import type { ITweet } from '../base/Tweet'
import type { IDataResult } from './DataResult'

/**
 * Represents the raw data of a single timeline tweet.
 *
 * @public
 */
export interface ITimelineTweet {
  tweet_results: IDataResult<ITweet | ILimitedVisibilityTweet>
}
