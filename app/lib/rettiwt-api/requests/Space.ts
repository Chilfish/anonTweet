import type { AxiosRequestConfig } from 'axios'

/**
 * Collection of requests related to Spaces.
 *
 * @public
 */
export class SpaceRequests {
  /**
   * @param id - The id of the Space whose details are to be fetched.
   *
   * @remarks
   * - `withReplays: true` 是拿到已结束场次（`Ended` / `TimedOut`）元数据的前提，
   *   缺省时 X 只返回进行中的场次。
   * - 响应结构为 `data.audioSpace.{ metadata, participants }`，卡片所需字段全在
   *   `metadata`（title / state / started_at / ended_at / total_*_listeners /
   *   creator_results）。录音本身的 m3u8 不在此响应内（需再打 v1.1
   *   `live_video_stream/status/{media_key}`），本期不做站内播放，故不请求。
   */
  public static details(id: string): AxiosRequestConfig {
    return {
      method: 'get',
      url: 'https://x.com/i/api/graphql/HPEisOmj1epUNLCWTYhUWw/AudioSpaceById',
      params: {

        variables: JSON.stringify({
          id,
          isMetatagsQuery: true,
          withDownvotePerspective: false,
          withReactionsMetadata: false,
          withReactionsPerspective: false,
          withReplays: true,
          withSuperFollowsUserFields: true,
          withSuperFollowsTweetFields: true,
        }),
        features: JSON.stringify({
          dont_mention_me_view_api_enabled: true,
          interactive_text_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          responsive_web_enhance_cards_enabled: true,
          responsive_web_uc_gql_enabled: true,
          spaces_2022_h2_clipping: true,
          spaces_2022_h2_spaces_communities: false,
          standardized_nudges_misinfo: true,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: false,
          vibe_api_enabled: true,
        }),

      },
      paramsSerializer: { encode: encodeURIComponent },
    }
  }
}
