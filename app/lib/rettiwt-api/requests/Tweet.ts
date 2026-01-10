import type { AxiosRequestConfig } from 'axios'

import type { ITweetFilter } from '../types/args/FetchArgs'
import type { INewTweet } from '../types/args/PostArgs'
import { RawTweetRepliesSortType, RawTweetSearchResultType } from '../enums/raw/Tweet'
import { TweetFilter } from '../models/args/FetchArgs'
import { NewTweet } from '../models/args/PostArgs'
import { MediaVariable, ReplyVariable } from '../models/params/Variables'

/**
 * Collection of requests related to tweets.
 *
 * @public
 */
export class TweetRequests {
  /**
   * @param id - The ID of the tweet to bookmark
   */
  public static bookmark(id: string): AxiosRequestConfig {
    return {
      method: 'post',
      url: 'https://x.com/i/api/graphql/aoDbu3RHznuiSkQ9aNM67Q/CreateBookmark',
      data: {

        variables: JSON.stringify({ tweet_id: id }),

      },
    }
  }

  /**
   * @param ids - The IDs of the tweets whose details are to be fetched.
   */
  public static bulkDetails(ids: string[]): AxiosRequestConfig {
    return {
      method: 'get',
      url: 'https://x.com/i/api/graphql/-R17e8UqwApFGdMxa3jASA/TweetResultsByRestIds',
      params: {

        variables: JSON.stringify({
          tweetIds: ids,
          referrer: 'home',
          with_rux_injections: false,
          includePromotedContent: false,
          withCommunity: false,
          withQuickPromoteEligibilityTweetFields: false,
          withBirdwatchNotes: false,
          withVoice: false,
          withV2Timeline: false,
        }),
        features: JSON.stringify({
          rweb_lists_timeline_redesign_enabled: true,
          responsive_web_graphql_exclude_directive_enabled: true,
          verified_phone_label_enabled: true,
          creator_subscriptions_tweet_preview_api_enabled: true,
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          tweetypie_unmention_optimization_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
          responsive_web_twitter_article_tweet_consumption_enabled: false,
          tweet_awards_web_tipping_enabled: false,
          freedom_of_speech_not_reach_fetch_enabled: true,
          standardized_nudges_misinfo: true,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
          longform_notetweets_rich_text_read_enabled: true,
          longform_notetweets_inline_media_enabled: true,
          responsive_web_media_download_video_enabled: false,
          responsive_web_enhance_cards_enabled: false,
          responsive_web_grok_show_grok_translated_post: false,
          responsive_web_grok_analyze_post_followups_enabled: false,
          responsive_web_jetfuel_frame: false,
          responsive_web_grok_image_annotation_enabled: false,
          communities_web_enable_tweet_community_results_fetch: false,
          c9s_tweet_anatomy_moderator_badge_enabled: false,
          premium_content_api_read_enabled: false,
          responsive_web_grok_analysis_button_from_backend: false,
          profile_label_improvements_pcf_label_in_post_enabled: false,
          rweb_tipjar_consumption_enabled: false,
          creator_subscriptions_quote_tweet_preview_enabled: false,
          responsive_web_grok_analyze_button_fetch_trends_enabled: false,
          articles_preview_enabled: false,
          responsive_web_grok_share_attachment_enabled: false,
          responsive_web_grok_imagine_annotation_enabled: false,
          responsive_web_grok_community_note_auto_translation_is_enabled: false,
          responsive_web_profile_redirect_enabled: false,
        }),

      },
      paramsSerializer: { encode: encodeURIComponent },
    }
  }

  /**
   * @param id - The id of the tweet whose details are to be fetched.
   */
  public static details(id: string): AxiosRequestConfig {
    return {
      method: 'get',
      url: 'https://x.com/i/api/graphql/aFvUsJm2c-oDkJV75blV6g/TweetResultByRestId',
      params: {
        variables: JSON.stringify({
          tweetId: id,
          referrer: 'home',
          with_rux_injections: false,
          includePromotedContent: false,
          withCommunity: false,
          withQuickPromoteEligibilityTweetFields: false,
          withBirdwatchNotes: false,
          withVoice: false,
          withV2Timeline: false,
        }),
        features: JSON.stringify({
          creator_subscriptions_tweet_preview_api_enabled: true,
          premium_content_api_read_enabled: false,
          communities_web_enable_tweet_community_results_fetch: true,
          c9s_tweet_anatomy_moderator_badge_enabled: true,
          responsive_web_grok_analyze_button_fetch_trends_enabled: false,
          responsive_web_grok_analyze_post_followups_enabled: false,
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
          responsive_web_grok_analysis_button_from_backend: false,
          creator_subscriptions_quote_tweet_preview_enabled: false,
          freedom_of_speech_not_reach_fetch_enabled: true,
          standardized_nudges_misinfo: true,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
          longform_notetweets_rich_text_read_enabled: true,
          longform_notetweets_inline_media_enabled: true,
          profile_label_improvements_pcf_label_in_post_enabled: true,
          rweb_tipjar_consumption_enabled: true,
          verified_phone_label_enabled: true,
          responsive_web_grok_image_annotation_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_enhance_cards_enabled: false,
          responsive_web_grok_community_note_auto_translation_is_enabled: false,
          responsive_web_grok_imagine_annotation_enabled: false,
          responsive_web_profile_redirect_enabled: true,
        }),
      },
      paramsSerializer: { encode: encodeURIComponent },
    }
  }

  /**
   * @param id - The id of the tweet to be liked.
   */
  public static like(id: string): AxiosRequestConfig {
    return {
      method: 'post',
      url: 'https://x.com/i/api/graphql/lI07N6Otwv1PhnEgXILM7A/FavoriteTweet',
      data: {

        variables: {
          tweet_id: id,
        },

      },
    }
  }

  /**
   * @param id - The id of the tweet whose likers are to be fetched.
   * @param count - The number of likers to fetch. Only works as a lower limit when used with a cursor.
   * @param cursor - The cursor to the batch of likers to fetch.
   */
  public static likers(id: string, count?: number, cursor?: string): AxiosRequestConfig {
    return {
      method: 'get',
      url: 'https://x.com/i/api/graphql/b3OrdeHDQfb9zRMC0fV3bw/Favoriters',
      params: {

        variables: JSON.stringify({
          tweetId: id,
          count,
          cursor,
          enableRanking: false,
          includePromotedContent: false,
        }),
        features: JSON.stringify({
          rweb_video_screen_enabled: false,
          profile_label_improvements_pcf_label_in_post_enabled: true,
          responsive_web_profile_redirect_enabled: false,
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
          responsive_web_jetfuel_frame: true,
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
          responsive_web_grok_imagine_annotation_enabled: true,
          responsive_web_grok_community_note_auto_translation_is_enabled: false,
          responsive_web_enhance_cards_enabled: false,
        }),

      },
      paramsSerializer: { encode: encodeURIComponent },
    }
  }

  /**
   * @param args - The configuration object for the tweet to be posted.
   */
  public static post(args: INewTweet): AxiosRequestConfig {
    // Parsing the args
    const parsedArgs = new NewTweet(args)

    return {
      method: 'post',
      url: 'https://x.com/i/api/graphql/Uf3io9zVp1DsYxrmL5FJ7g/CreateTweet',
      data: {

        variables: {
          tweet_text: parsedArgs.text,
          dark_request: false,
          attachment_url: parsedArgs.quote ? `https://x.com/i/status/${parsedArgs.quote}` : undefined,
          media: parsedArgs.media ? new MediaVariable(parsedArgs.media) : undefined,
          reply: parsedArgs.replyTo ? new ReplyVariable(parsedArgs.replyTo) : undefined,
          semantic_annotation_ids: [],
        },
        features: {
          premium_content_api_read_enabled: false,
          communities_web_enable_tweet_community_results_fetch: true,
          c9s_tweet_anatomy_moderator_badge_enabled: true,
          responsive_web_grok_analyze_button_fetch_trends_enabled: false,
          responsive_web_grok_analyze_post_followups_enabled: true,
          responsive_web_jetfuel_frame: false,
          responsive_web_grok_share_attachment_enabled: true,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
          responsive_web_twitter_article_tweet_consumption_enabled: true,
          tweet_awards_web_tipping_enabled: false,
          responsive_web_grok_show_grok_translated_post: false,
          responsive_web_grok_analysis_button_from_backend: true,
          creator_subscriptions_quote_tweet_preview_enabled: false,
          longform_notetweets_rich_text_read_enabled: true,
          longform_notetweets_inline_media_enabled: true,
          profile_label_improvements_pcf_label_in_post_enabled: true,
          rweb_tipjar_consumption_enabled: true,
          verified_phone_label_enabled: true,
          articles_preview_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          freedom_of_speech_not_reach_fetch_enabled: true,
          standardized_nudges_misinfo: true,
          tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
          responsive_web_grok_image_annotation_enabled: true,
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_enhance_cards_enabled: false,
          responsive_web_grok_imagine_annotation_enabled: false,
          responsive_web_profile_redirect_enabled: false,
          responsive_web_grok_community_note_auto_translation_is_enabled: false,
        },

      },
    }
  }

  /**
   * @param id - The id of the tweet whose replies are to be fetched.
   * @param cursor - The cursor to the batch of replies to fetch.
   */
  public static replies(id: string, cursor?: string, sortBy?: RawTweetRepliesSortType): AxiosRequestConfig {
    return {
      method: 'get',
      url: 'https://x.com/i/api/graphql/97JF30KziU00483E_8elBA/TweetDetail',
      params: {

        variables: JSON.stringify({
          focalTweetId: id,
          cursor,
          referrer: 'tweet',
          with_rux_injections: false,
          rankingMode: sortBy ?? RawTweetRepliesSortType.RELEVACE,
          includePromotedContent: true,
          withCommunity: true,
          withQuickPromoteEligibilityTweetFields: true,
          withBirdwatchNotes: true,
          withVoice: true,
        }),
        features: JSON.stringify({
          rweb_video_screen_enabled: false,
          profile_label_improvements_pcf_label_in_post_enabled: true,
          responsive_web_profile_redirect_enabled: false,
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
          responsive_web_jetfuel_frame: true,
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
          responsive_web_grok_imagine_annotation_enabled: true,
          responsive_web_grok_community_note_auto_translation_is_enabled: false,
          responsive_web_enhance_cards_enabled: false,
        }),
        fieldToggles: JSON.stringify({
          withArticleRichContentState: true,
          withArticlePlainText: false,
          withGrokAnalyze: false,
          withDisallowedReplyControls: false,
        }),

      },
      paramsSerializer: { encode: encodeURIComponent },
    }
  }

  /**
   * @param id - The id of the tweet which is to be retweeted.
   */
  public static retweet(id: string): AxiosRequestConfig {
    return {
      method: 'post',
      url: 'https://x.com/i/api/graphql/LFho5rIi4xcKO90p9jwG7A/CreateRetweet',
      data: {
        variables: {

          tweet_id: id,
          dark_request: false,

        },
      },
    }
  }

  /**
   * @param id - The id of the tweet whose retweeters are to be fetched.
   * @param count - The number of retweeters to fetch. Only works as a lower limit when used with a cursor.
   * @param cursor - The cursor to the batch of retweeters to fetch.
   */
  public static retweeters(id: string, count?: number, cursor?: string): AxiosRequestConfig {
    return {
      method: 'get',
      url: 'https://x.com/i/api/graphql/wfglZEC0MRgBdxMa_1a5YQ/Retweeters',
      params: {

        variables: JSON.stringify({
          tweetId: id,
          count,
          cursor,
          includePromotedContent: false,
        }),
        features: JSON.stringify({
          rweb_video_screen_enabled: false,
          profile_label_improvements_pcf_label_in_post_enabled: true,
          responsive_web_profile_redirect_enabled: false,
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
          responsive_web_jetfuel_frame: true,
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
          responsive_web_grok_imagine_annotation_enabled: true,
          responsive_web_grok_community_note_auto_translation_is_enabled: false,
          responsive_web_enhance_cards_enabled: false,
        }),

      },
      paramsSerializer: { encode: encodeURIComponent },
    }
  }

  /**
   * @param args - The configuration object for the tweet to be posted.
   *
   * @remarks - Only `text` and `media.id` parameters are supported.
   */
  public static schedule(args: INewTweet): AxiosRequestConfig {
    // Parsing the args
    const parsedArgs = new NewTweet(args)

    return {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://x.com/i/api/graphql/LCVzRQGxOaGnOnYH01NQXg/CreateScheduledTweet',
      data: {

        variables: {
          post_tweet_request: {
            auto_populate_reply_metadata: false,
            status: parsedArgs.text,
            exclude_reply_user_ids: [],
            media_ids: parsedArgs.media?.map(item => item.id) ?? [],
          },
          execute_at: Math.floor((parsedArgs.scheduleFor ?? new Date()).getTime() / 1000),
        },

      },
    }
  }

  /**
   * @param filter - The filter to use for searching tweets.
   * @param count - The number of tweets to fetch. Only works as a lower limit when used with a cursor.
   * @param cursor - The cursor to the batch of tweets to fetch.
   */
  public static search(filter: ITweetFilter, count?: number, cursor?: string): AxiosRequestConfig {
    // Parsing the filter
    const parsedFilter = new TweetFilter(filter)

    return {
      method: 'get',
      url: 'https://x.com/i/api/graphql/M1jEez78PEfVfbQLvlWMvQ/SearchTimeline',
      params: {

        variables: JSON.stringify({
          rawQuery: new TweetFilter(parsedFilter).toString(),
          count,
          cursor,
          querySource: 'typed_query',
          product: parsedFilter.top ? RawTweetSearchResultType.TOP : RawTweetSearchResultType.LATEST,
          withGrokTranslatedBio: false,
        }),
        features: JSON.stringify({
          rweb_video_screen_enabled: false,
          profile_label_improvements_pcf_label_in_post_enabled: true,
          responsive_web_profile_redirect_enabled: false,
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
          responsive_web_jetfuel_frame: true,
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
          responsive_web_grok_imagine_annotation_enabled: true,
          responsive_web_grok_community_note_auto_translation_is_enabled: false,
          responsive_web_enhance_cards_enabled: false,
        }),

      },
      paramsSerializer: { encode: encodeURIComponent },
    }
  }

  /**
   * @param id - The id of the tweet to be unbookmarked.
   */
  public static unbookmark(id: string): AxiosRequestConfig {
    return {
      method: 'post',
      url: 'https://x.com/i/api/graphql/Wlmlj2-xzyS1GN3a6cj-mQ/DeleteBookmark',
      data: {

        variables: {
          tweet_id: id,
        },

      },
    }
  }

  /**
   * @param id - The id of the tweet to be unliked.
   */
  public static unlike(id: string): AxiosRequestConfig {
    return {
      method: 'post',
      url: 'https://x.com/i/api/graphql/ZYKSe-w7KEslx3JhSIk5LA/UnfavoriteTweet',
      data: {

        variables: {
          tweet_id: id,
        },

      },
    }
  }

  /**
   * @param id - The id of the tweet to be unposted.
   */
  public static unpost(id: string): AxiosRequestConfig {
    return {
      method: 'post',
      url: 'https://x.com/i/api/graphql/VaenaVgh5q5ih7kvyVjgtg/DeleteTweet',
      data: {

        variables: {
          tweet_id: id,
        },

      },
    }
  }

  /**
   * @param id - The id of the source tweet (which was retweeted), to be unretweeted.
   */
  public static unretweet(id: string): AxiosRequestConfig {
    return {
      method: 'post',
      url: 'https://x.com/i/api/graphql/iQtK4dl5hBmXewYZuEOKVw/DeleteRetweet',
      data: {

        variables: {
          source_tweet_id: id,
        },

      },
    }
  }

  /**
   * @param id - The id of the scheduled tweet to be unscheduled.
   */
  public static unschedule(id: string): AxiosRequestConfig {
    return {
      method: 'post',
      url: 'https://x.com/i/api/graphql/CTOVqej0JBXAZSwkp1US0g/DeleteScheduledTweet',
      data: {

        variables: {
          scheduled_tweet_id: id,
        },
        queryId: 'CTOVqej0JBXAZSwkp1US0g',

      },
    }
  }
}
