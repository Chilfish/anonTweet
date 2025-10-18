import type { TweetRepliesSortType } from '../enums/Tweet'
import { RawTweetRepliesSortType } from '../enums/raw/Tweet'

/**
 * Collection of mapping from parsed reply sort type to raw reply sort type.
 *
 * @internal
 */
export const TweetRepliesSortTypeMap: { [key in keyof typeof TweetRepliesSortType]: RawTweetRepliesSortType } = {

  LATEST: RawTweetRepliesSortType.LATEST,
  LIKES: RawTweetRepliesSortType.LIKES,
  RELEVANCE: RawTweetRepliesSortType.RELEVACE,

}
