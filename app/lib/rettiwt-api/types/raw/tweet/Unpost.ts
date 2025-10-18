/**
 * The raw data received when unposting a tweet.
 *
 * @public
 */
export interface ITweetUnpostResponse {
  data: Data
}

interface Data {
  delete_tweet: DeleteTweet
}

interface DeleteTweet {
  tweet_results: TweetResults
}

interface TweetResults {}
