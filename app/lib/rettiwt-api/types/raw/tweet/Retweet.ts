/**
 * The raw data received when after retweeting a tweet.
 *
 * @public
 */
export interface ITweetRetweetResponse {
  data: Data
}

interface Data {
  create_retweet: CreateRetweet
}

interface CreateRetweet {
  retweet_results: RetweetResults
}

interface RetweetResults {
  result: Result
}

interface Result {
  rest_id: string
  legacy: Legacy
}

interface Legacy {
  full_text: string
}
