import type { AxiosRequestConfig } from 'axios'

/**
 * Collection of requests related to lists.
 *
 * @public
 */
export class ListRequests {
  /**
   * @param listId - The ID of the target list.
   * @param userId - The ID of the user to be added as a member.
   */
  public static addMember(listId: string, userId: string): AxiosRequestConfig {
    return {
      method: 'post',
      url: 'https://x.com/i/api/graphql/uFQumgzNDR27zs0yK5J3Fw/ListAddMember',
      data: {

        variables: {
          listId,
          userId,
        },
        features: {
          payments_enabled: false,
          profile_label_improvements_pcf_label_in_post_enabled: false,
          rweb_tipjar_consumption_enabled: false,
          verified_phone_label_enabled: false,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          responsive_web_graphql_timeline_navigation_enabled: false,
        },

      },
    }
  }

  /**
   * @param id - The id of the list whose details are to be fetched.
   */
  public static details(id: string): AxiosRequestConfig {
    return {
      method: 'get',
      url: 'https://x.com/i/api/graphql/gO1_eYPohKYHwCG2m-1ZnQ/ListByRestId',
      params: {
        variables: JSON.stringify({ listId: id }),
        features: JSON.stringify({
          rweb_lists_timeline_redesign_enabled: true,
          responsive_web_graphql_exclude_directive_enabled: true,
          verified_phone_label_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          responsive_web_graphql_timeline_navigation_enabled: true,
        }),
      },
      paramsSerializer: { encode: encodeURIComponent },
    }
  }

  /**
   * @param id - The id of the list whose members are to be fetched.
   * @param count - The number of members to fetch. Must be \<= 100.
   * @param cursor - The cursor to the batch of members to fetch.
   */
  public static members(id: string, count?: number, cursor?: string): AxiosRequestConfig {
    return {
      method: 'get',
      url: 'https://x.com/i/api/graphql/T7VZsrWpCoi4jWxFdwyNcg/ListMembers',
      params: {
        variables: JSON.stringify({
          listId: id,
          count,
          cursor,
        }),
        features: JSON.stringify({
          rweb_video_screen_enabled: false,
          profile_label_improvements_pcf_label_in_post_enabled: true,
          rweb_tipjar_consumption_enabled: true,
          verified_phone_label_enabled: true,
          creator_subscriptions_tweet_preview_api_enabled: true,
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          premium_content_api_read_enabled: false,
          communities_web_enable_tweet_community_results_fetch: true,
          c9s_tweet_anatomy_moderator_badge_enabled: true,
          responsive_web_grok_analyze_button_fetch_trends_enabled: false,
          responsive_web_grok_analyze_post_followups_enabled: true,
          responsive_web_jetfuel_frame: false,
          responsive_web_grok_share_attachment_enabled: true,
          articles_preview_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
          responsive_web_twitter_article_tweet_consumption_enabled: true,
          tweet_awards_web_tipping_enabled: false,
          responsive_web_grok_show_grok_translated_post: false,
          responsive_web_grok_analysis_button_from_backend: true,
          creator_subscriptions_quote_tweet_preview_enabled: false,
          freedom_of_speech_not_reach_fetch_enabled: true,
          standardized_nudges_misinfo: true,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
          longform_notetweets_rich_text_read_enabled: true,
          longform_notetweets_inline_media_enabled: true,
          responsive_web_grok_image_annotation_enabled: true,
          responsive_web_enhance_cards_enabled: false,
        }),
      },
    }
  }

  /**
   * @param listId - The ID of the target list.
   * @param userId - The ID of the user to remove as a member.
   */
  public static removeMember(listId: string, userId: string): AxiosRequestConfig {
    return {
      method: 'post',
      url: 'https://x.com/i/api/graphql/IzgPnK3wZpNgpcN31ry3Xg/ListRemoveMember',
      data: {

        variables: {
          listId,
          userId,
        },
        features: {
          payments_enabled: false,
          profile_label_improvements_pcf_label_in_post_enabled: false,
          rweb_tipjar_consumption_enabled: false,
          verified_phone_label_enabled: false,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          responsive_web_graphql_timeline_navigation_enabled: false,
        },

      },
    }
  }

  /**
   * @param id - The id of the list whose tweets are to be fetched.
   * @param count - The number of tweets to fetch. Must be \<= 100.
   * @param cursor - The cursor to the batch of tweets to fetch.
   */
  public static tweets(id: string, count?: number, cursor?: string): AxiosRequestConfig {
    return {
      method: 'get',
      url: 'https://x.com/i/api/graphql/BkauSnPUDQTeeJsxq17opA/ListLatestTweetsTimeline',
      params: {
        variables: JSON.stringify({
          listId: id,
          count,
          cursor,
        }),
        features: JSON.stringify({
          rweb_video_screen_enabled: false,
          profile_label_improvements_pcf_label_in_post_enabled: true,
          rweb_tipjar_consumption_enabled: true,
          verified_phone_label_enabled: true,
          creator_subscriptions_tweet_preview_api_enabled: true,
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          premium_content_api_read_enabled: false,
          communities_web_enable_tweet_community_results_fetch: true,
          c9s_tweet_anatomy_moderator_badge_enabled: true,
          responsive_web_grok_analyze_button_fetch_trends_enabled: false,
          responsive_web_grok_analyze_post_followups_enabled: true,
          responsive_web_jetfuel_frame: false,
          responsive_web_grok_share_attachment_enabled: true,
          articles_preview_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
          responsive_web_twitter_article_tweet_consumption_enabled: true,
          tweet_awards_web_tipping_enabled: false,
          responsive_web_grok_show_grok_translated_post: false,
          responsive_web_grok_analysis_button_from_backend: true,
          creator_subscriptions_quote_tweet_preview_enabled: false,
          freedom_of_speech_not_reach_fetch_enabled: true,
          standardized_nudges_misinfo: true,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
          longform_notetweets_rich_text_read_enabled: true,
          longform_notetweets_inline_media_enabled: true,
          responsive_web_grok_image_annotation_enabled: true,
          responsive_web_enhance_cards_enabled: false,
        }),
      },
      paramsSerializer: { encode: encodeURIComponent },
    }
  }
}
