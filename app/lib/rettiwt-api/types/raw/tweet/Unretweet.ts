/**
 * The raw data received when unretweeting a tweet.
 *
 * @public
 */
export interface ITweetUnretweetResponse {
  data: Data
}

interface Data {
  unretweet: Unretweet
}

interface Unretweet {
  source_tweet_results: SourceTweetResults
}

interface SourceTweetResults {
  result: Result
}

interface Result {
  rest_id: string
  legacy: Legacy
}

interface Legacy {
  full_text: string
}
