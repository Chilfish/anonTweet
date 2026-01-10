import type { BookmarkFolder } from '../models/data/BookmarkFolder'
import type { Notification } from '../models/data/Notification'
import type { IConversationTimelineResponse } from '../types/raw/dm/Conversation'
import type { IInboxInitialResponse } from '../types/raw/dm/InboxInitial'
import type { IInboxTimelineResponse } from '../types/raw/dm/InboxTimeline'
import type { IListMemberAddResponse } from '../types/raw/list/AddMember'
import type { IListDetailsResponse } from '../types/raw/list/Details'
import type { IListMembersResponse } from '../types/raw/list/Members'
import type { IListMemberRemoveResponse } from '../types/raw/list/RemoveMember'
import type { IListTweetsResponse } from '../types/raw/list/Tweets'
import type { IMediaInitializeUploadResponse } from '../types/raw/media/InitalizeUpload'
import type { ITweetBookmarkResponse } from '../types/raw/tweet/Bookmark'
import type { ITweetDetailsResponse } from '../types/raw/tweet/Details'
import type { ITweetDetailsBulkResponse } from '../types/raw/tweet/DetailsBulk'
import type { ITweetLikeResponse } from '../types/raw/tweet/Like'
import type { ITweetLikersResponse } from '../types/raw/tweet/Likers'
import type { ITweetPostResponse } from '../types/raw/tweet/Post'
import type { ITweetRepliesResponse } from '../types/raw/tweet/Replies'
import type { ITweetRetweetResponse } from '../types/raw/tweet/Retweet'
import type { ITweetRetweetersResponse } from '../types/raw/tweet/Retweeters'
import type { ITweetScheduleResponse } from '../types/raw/tweet/Schedule'
import type { ITweetSearchResponse } from '../types/raw/tweet/Search'
import type { ITweetUnbookmarkResponse } from '../types/raw/tweet/Unbookmark'
import type { ITweetUnlikeResponse } from '../types/raw/tweet/Unlike'
import type { ITweetUnpostResponse } from '../types/raw/tweet/Unpost'
import type { ITweetUnretweetResponse } from '../types/raw/tweet/Unretweet'
import type { ITweetUnscheduleResponse } from '../types/raw/tweet/Unschedule'
import type { IUserAffiliatesResponse } from '../types/raw/user/Affiliates'
import type { IUserAnalyticsResponse } from '../types/raw/user/Analytics'
import type { IUserBookmarkFoldersResponse } from '../types/raw/user/BookmarkFolders'
import type { IUserBookmarkFolderTweetsResponse } from '../types/raw/user/BookmarkFolderTweets'
import type { IUserBookmarksResponse } from '../types/raw/user/Bookmarks'
import type { IUserDetailsResponse } from '../types/raw/user/Details'
import type { IUserDetailsBulkResponse } from '../types/raw/user/DetailsBulk'
import type { IUserFollowResponse } from '../types/raw/user/Follow'
import type { IUserFollowedResponse } from '../types/raw/user/Followed'
import type { IUserFollowersResponse } from '../types/raw/user/Followers'
import type { IUserFollowingResponse } from '../types/raw/user/Following'
import type { IUserHighlightsResponse } from '../types/raw/user/Highlights'
import type { IUserLikesResponse } from '../types/raw/user/Likes'
import type { IUserListsResponse } from '../types/raw/user/Lists'
import type { IUserMediaResponse } from '../types/raw/user/Media'
import type { IUserNotificationsResponse } from '../types/raw/user/Notifications'
import type { IUserProfileUpdateResponse } from '../types/raw/user/ProfileUpdate'
import type { IUserRecommendedResponse } from '../types/raw/user/Recommended'
import type { IUserSubscriptionsResponse } from '../types/raw/user/Subscriptions'
import type { IUserTweetsResponse } from '../types/raw/user/Tweets'
import type { IUserTweetsAndRepliesResponse } from '../types/raw/user/TweetsAndReplies'
import type { IUserUnfollowResponse } from '../types/raw/user/Unfollow'
import { BaseType } from '../enums/Data'
import { Analytics } from '../models/data/Analytics'
import { Conversation } from '../models/data/Conversation'
import { CursoredData } from '../models/data/CursoredData'
import { Inbox } from '../models/data/Inbox'
import { List } from '../models/data/List'
import { Tweet } from '../models/data/Tweet'
import { User } from '../models/data/User'

/**
 * Collection of data extractors for each resource.
 *
 * @internal
 */
export const Extractors = {

  LIST_DETAILS: (response: IListDetailsResponse, id: string): List | undefined => List.single(response, id),
  LIST_MEMBERS: (response: IListMembersResponse): CursoredData<User> =>
    new CursoredData<User>(response, BaseType.USER),
  LIST_MEMBER_ADD: (response: IListMemberAddResponse): number | undefined =>
    response.data?.list?.member_count ?? undefined,
  LIST_MEMBER_REMOVE: (response: IListMemberRemoveResponse): number | undefined =>
    response.data?.list?.member_count ?? undefined,
  LIST_TWEETS: (response: IListTweetsResponse): CursoredData<Tweet> =>
    new CursoredData<Tweet>(response, BaseType.TWEET),

  MEDIA_UPLOAD_APPEND: (): void => undefined,
  MEDIA_UPLOAD_FINALIZE: (): void => undefined,
  MEDIA_UPLOAD_INITIALIZE: (response: IMediaInitializeUploadResponse): string =>
    response.media_id_string ?? undefined,

  DM_CONVERSATION: (response: IConversationTimelineResponse): Conversation | undefined =>
    Conversation.fromConversationTimeline(response),
  DM_INBOX_INITIAL_STATE: (response: IInboxInitialResponse): Inbox => new Inbox(response),
  DM_INBOX_TIMELINE: (response: IInboxTimelineResponse): Inbox => new Inbox(response),

  TWEET_BOOKMARK: (response: ITweetBookmarkResponse): boolean => response?.data?.tweet_bookmark_put === 'Done',
  TWEET_DETAILS: (response: ITweetDetailsResponse, id: string): Tweet | undefined => Tweet.single(response, id),
  TWEET_DETAILS_ALT: (response: ITweetRepliesResponse, id: string): Tweet | undefined => Tweet.single(response, id),
  TWEET_DETAILS_BULK: (response: ITweetDetailsBulkResponse, ids: string[]): Tweet[] => Tweet.multiple(response, ids),
  TWEET_LIKE: (response: ITweetLikeResponse): boolean => (!!response?.data?.favorite_tweet),
  TWEET_LIKERS: (response: ITweetLikersResponse): CursoredData<User> =>
    new CursoredData<User>(response, BaseType.USER),
  TWEET_POST: (response: ITweetPostResponse): string =>
    response?.data?.create_tweet?.tweet_results?.result?.rest_id ?? undefined,
  TWEET_REPLIES: (response: ITweetDetailsResponse): CursoredData<Tweet> =>
    new CursoredData<Tweet>(response, BaseType.TWEET),
  TWEET_RETWEET: (response: ITweetRetweetResponse): boolean => (!!response?.data?.create_retweet),
  TWEET_RETWEETERS: (response: ITweetRetweetersResponse): CursoredData<User> =>
    new CursoredData<User>(response, BaseType.USER),
  TWEET_SCHEDULE: (response: ITweetScheduleResponse): string => response?.data?.tweet?.rest_id ?? undefined,
  TWEET_SEARCH: (response: ITweetSearchResponse): CursoredData<Tweet> =>
    new CursoredData<Tweet>(response, BaseType.TWEET),
  TWEET_UNBOOKMARK: (response: ITweetUnbookmarkResponse): boolean => response?.data?.tweet_bookmark_delete === 'Done',
  TWEET_UNLIKE: (response: ITweetUnlikeResponse): boolean => (!!response?.data?.unfavorite_tweet),
  TWEET_UNPOST: (response: ITweetUnpostResponse): boolean => (!!response?.data?.delete_tweet),
  TWEET_UNRETWEET: (response: ITweetUnretweetResponse): boolean =>
    !!response?.data?.unretweet?.source_tweet_results?.result,
  TWEET_UNSCHEDULE: (response: ITweetUnscheduleResponse): boolean => response?.data?.scheduledtweet_delete === 'Done',

  USER_AFFILIATES: (response: IUserAffiliatesResponse): CursoredData<User> =>
    new CursoredData<User>(response, BaseType.USER),
  USER_ANALYTICS: (response: IUserAnalyticsResponse): Analytics =>
    new Analytics(response.data.viewer_v2.user_results.result),
  USER_BOOKMARKS: (response: IUserBookmarksResponse): CursoredData<Tweet> =>
    new CursoredData<Tweet>(response, BaseType.TWEET),
  USER_BOOKMARK_FOLDERS: (response: IUserBookmarkFoldersResponse): CursoredData<BookmarkFolder> =>
    new CursoredData<BookmarkFolder>(response, BaseType.BOOKMARK_FOLDER),
  USER_BOOKMARK_FOLDER_TWEETS: (response: IUserBookmarkFolderTweetsResponse): CursoredData<Tweet> =>
    new CursoredData<Tweet>(response, BaseType.TWEET),
  USER_DETAILS_BY_USERNAME: (response: IUserDetailsResponse): User | undefined => User.single(response),
  USER_DETAILS_BY_ID: (response: IUserDetailsResponse): User | undefined => User.single(response),
  USER_DETAILS_BY_IDS_BULK: (response: IUserDetailsBulkResponse, ids: string[]): User[] =>
    User.multiple(response, ids),
  USER_FEED_FOLLOWED: (response: IUserFollowedResponse): CursoredData<Tweet> =>
    new CursoredData<Tweet>(response, BaseType.TWEET),
  USER_FEED_RECOMMENDED: (response: IUserRecommendedResponse): CursoredData<Tweet> =>
    new CursoredData<Tweet>(response, BaseType.TWEET),
  USER_FOLLOW: (response: IUserFollowResponse): boolean => (!!response?.id),
  USER_FOLLOWING: (response: IUserFollowingResponse): CursoredData<User> =>
    new CursoredData<User>(response, BaseType.USER),
  USER_FOLLOWERS: (response: IUserFollowersResponse): CursoredData<User> =>
    new CursoredData<User>(response, BaseType.USER),
  USER_HIGHLIGHTS: (response: IUserHighlightsResponse): CursoredData<Tweet> =>
    new CursoredData<Tweet>(response, BaseType.TWEET),
  USER_LISTS: (response: IUserListsResponse): CursoredData<List> => new CursoredData<List>(response, BaseType.LIST),
  USER_LIKES: (response: IUserLikesResponse): CursoredData<Tweet> =>
    new CursoredData<Tweet>(response, BaseType.TWEET),
  USER_MEDIA: (response: IUserMediaResponse): CursoredData<Tweet> =>
    new CursoredData<Tweet>(response, BaseType.TWEET),
  USER_NOTIFICATIONS: (response: IUserNotificationsResponse): CursoredData<Notification> =>
    new CursoredData<Notification>(response, BaseType.NOTIFICATION),
  USER_SUBSCRIPTIONS: (response: IUserSubscriptionsResponse): CursoredData<User> =>
    new CursoredData<User>(response, BaseType.USER),
  USER_TIMELINE: (response: IUserTweetsResponse): CursoredData<Tweet> =>
    new CursoredData<Tweet>(response, BaseType.TWEET),
  USER_TIMELINE_AND_REPLIES: (response: IUserTweetsAndRepliesResponse): CursoredData<Tweet> =>
    new CursoredData<Tweet>(response, BaseType.TWEET),
  USER_UNFOLLOW: (response: IUserUnfollowResponse): boolean => (!!response?.id),
  USER_PROFILE_UPDATE: (response: IUserProfileUpdateResponse): boolean => (!!response?.name),
}
