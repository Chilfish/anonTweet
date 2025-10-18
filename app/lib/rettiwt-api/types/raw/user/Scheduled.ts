/**
 * The raw data received when fetching the list of scheduled tweets of the user.
 *
 * @public
 */
export interface IUserScheduledResponse {
  data: Data
}

interface Data {
  viewer: Viewer
}

interface Viewer {
  scheduled_tweet_list: ScheduledTweetList[]
}

interface ScheduledTweetList {
  rest_id: string
  scheduling_info: SchedulingInfo
  tweet_create_request: TweetCreateRequest
}

interface SchedulingInfo {
  execute_at: number
  state: string
}

interface TweetCreateRequest {
  type: string
  status: string
  exclude_reply_user_ids: any[]
  media_ids: any[]
  auto_populate_reply_metadata: boolean
}
