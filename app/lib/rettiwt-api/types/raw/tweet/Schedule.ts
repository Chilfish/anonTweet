/**
 * The raw data received after scheduling a tweet.
 *
 * @public
 */
export interface ITweetScheduleResponse {
  data: Data
}

interface Data {
  tweet: Tweet
}

interface Tweet {
  rest_id: string
}
