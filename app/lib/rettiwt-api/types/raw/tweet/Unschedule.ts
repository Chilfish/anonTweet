/**
 * The raw data received after unscheduling a tweet.
 *
 * @public
 */
export interface ITweetUnscheduleResponse {
  data: Data
}

interface Data {
  scheduledtweet_delete: string
}
