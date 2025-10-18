/**
 * The raw data received when unliking a tweet.
 *
 * @public
 */
export interface ITweetUnlikeResponse {
  data: Data
}

interface Data {
  unfavorite_tweet: string
}
