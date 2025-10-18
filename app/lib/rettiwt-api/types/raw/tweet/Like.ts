/**
 * The raw data received after favoriting a tweet.
 *
 * @public
 */
export interface ITweetLikeResponse {
  data: Data
}

interface Data {
  favorite_tweet: string
}
