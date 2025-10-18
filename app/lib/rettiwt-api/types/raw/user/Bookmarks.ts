/**
 * The raw data received when fetching the bookmarks of the given user.
 *
 * @public
 */
export interface IUserBookmarksResponse {
  data: Data
}

interface Data {
  bookmark_timeline_v2: BookmarkTimelineV2
}

interface BookmarkTimelineV2 {
  timeline: Timeline
}

interface Timeline {
  instructions: Instruction[]
  responseObjects: ResponseObjects
}

interface Instruction {
  type: string
  entries: Entry[]
}

interface Entry {
  entryId: string
  sortIndex: string
  content: Content
}

interface Content {
  entryType: string
  __typename: string
  itemContent?: ItemContent
  value?: string
  cursorType?: string
  stopOnEmptyResponse?: boolean
}

interface ItemContent {
  itemType: string
  __typename: string
  tweet_results: TweetResults
  tweetDisplayType: string
}

interface TweetResults {
  result: Result
}

interface Result {
  __typename: string
  rest_id: string
  core: Core
  unmention_data: UnmentionData
  edit_control: EditControl
  is_translatable: boolean
  views: Views
  source: string
  legacy: Legacy2
}

interface Core {
  user_results: UserResults
}

interface UserResults {
  result: Result2
}

interface Result2 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy
  professional: Professional
  tipjar_settings: TipjarSettings
  super_follow_eligible?: boolean
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel {
  label?: Label
}

interface Label {
  url: Url
  badge: Badge
  description: string
  userLabelType: string
  userLabelDisplayType: string
}

interface Url {
  url: string
  urlType: string
}

interface Badge {
  url: string
}

interface Legacy {
  following: boolean
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities
  fast_followers_count: number
  favourites_count: number
  followers_count: number
  friends_count: number
  has_custom_timelines: boolean
  is_translator: boolean
  listed_count: number
  location: string
  media_count: number
  name: string
  normal_followers_count: number
  pinned_tweet_ids_str: string[]
  possibly_sensitive: boolean
  profile_banner_url: string
  profile_image_url_https: string
  profile_interstitial_type: string
  screen_name: string
  statuses_count: number
  translator_type: string
  url?: string
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities {
  description: Description
  url?: Url2
}

interface Description {
  urls: any[]
}

interface Url2 {
  urls: Url3[]
}

interface Url3 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Professional {
  rest_id: string
  professional_type: string
  category: Category[]
}

interface Category {
  id: number
  name: string
  icon_name: string
}

interface TipjarSettings {
  is_enabled?: boolean
}

interface UnmentionData {}

interface EditControl {
  edit_tweet_ids: string[]
  editable_until_msecs: string
  is_edit_eligible: boolean
  edits_remaining: string
}

interface Views {
  count: string
  state: string
}

interface Legacy2 {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities2
  extended_entities: ExtendedEntities
  favorite_count: number
  favorited: boolean
  full_text: string
  is_quote_status: boolean
  lang: string
  possibly_sensitive: boolean
  possibly_sensitive_editable: boolean
  quote_count: number
  reply_count: number
  retweet_count: number
  retweeted: boolean
  user_id_str: string
  id_str: string
}

interface Entities2 {
  hashtags: any[]
  media: Medum[]
  symbols: any[]
  timestamps: any[]
  urls: any[]
  user_mentions: any[]
}

interface Medum {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_key: string
  media_url_https: string
  source_status_id_str?: string
  source_user_id_str?: string
  type: string
  url: string
  additional_media_info?: AdditionalMediaInfo
  ext_media_availability: ExtMediaAvailability
  sizes: Sizes
  original_info: OriginalInfo
  allow_download_status?: AllowDownloadStatus
  video_info?: VideoInfo
  media_results: MediaResults
  features?: Features
}

interface AdditionalMediaInfo {
  monetizable: boolean
  source_user: SourceUser
}

interface SourceUser {
  user_results: UserResults2
}

interface UserResults2 {
  result: Result3
}

interface Result3 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel2
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy3
  tipjar_settings: TipjarSettings2
  super_follow_eligible: boolean
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel2 {}

interface Legacy3 {
  following: boolean
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities3
  fast_followers_count: number
  favourites_count: number
  followers_count: number
  friends_count: number
  has_custom_timelines: boolean
  is_translator: boolean
  listed_count: number
  location: string
  media_count: number
  name: string
  normal_followers_count: number
  pinned_tweet_ids_str: any[]
  possibly_sensitive: boolean
  profile_banner_url: string
  profile_image_url_https: string
  profile_interstitial_type: string
  screen_name: string
  statuses_count: number
  translator_type: string
  url: string
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities3 {
  description: Description2
  url: Url4
}

interface Description2 {
  urls: any[]
}

interface Url4 {
  urls: Url5[]
}

interface Url5 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface TipjarSettings2 {}

interface ExtMediaAvailability {
  status: string
}

interface Sizes {
  large: Large
  medium: Medium
  small: Small
  thumb: Thumb
}

interface Large {
  h: number
  w: number
  resize: string
}

interface Medium {
  h: number
  w: number
  resize: string
}

interface Small {
  h: number
  w: number
  resize: string
}

interface Thumb {
  h: number
  w: number
  resize: string
}

interface OriginalInfo {
  height: number
  width: number
  focus_rects: FocusRect[]
}

interface FocusRect {
  x: number
  y: number
  w: number
  h: number
}

interface AllowDownloadStatus {
  allow_download: boolean
}

interface VideoInfo {
  aspect_ratio: number[]
  duration_millis: number
  variants: Variant[]
}

interface Variant {
  content_type: string
  url: string
  bitrate?: number
}

interface MediaResults {
  result: Result4
}

interface Result4 {
  media_key: string
}

interface Features {
  large: Large2
  medium: Medium2
  small: Small2
  orig: Orig
}

interface Large2 {
  faces: any[]
}

interface Medium2 {
  faces: any[]
}

interface Small2 {
  faces: any[]
}

interface Orig {
  faces: any[]
}

interface ExtendedEntities {
  media: Medum2[]
}

interface Medum2 {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_key: string
  media_url_https: string
  source_status_id_str?: string
  source_user_id_str?: string
  type: string
  url: string
  additional_media_info?: AdditionalMediaInfo2
  ext_media_availability: ExtMediaAvailability2
  sizes: Sizes2
  original_info: OriginalInfo2
  allow_download_status?: AllowDownloadStatus2
  video_info?: VideoInfo2
  media_results: MediaResults2
  features?: Features2
}

interface AdditionalMediaInfo2 {
  monetizable: boolean
  source_user: SourceUser2
}

interface SourceUser2 {
  user_results: UserResults3
}

interface UserResults3 {
  result: Result5
}

interface Result5 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel3
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy4
  tipjar_settings: TipjarSettings3
  super_follow_eligible: boolean
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel3 {}

interface Legacy4 {
  following: boolean
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities4
  fast_followers_count: number
  favourites_count: number
  followers_count: number
  friends_count: number
  has_custom_timelines: boolean
  is_translator: boolean
  listed_count: number
  location: string
  media_count: number
  name: string
  normal_followers_count: number
  pinned_tweet_ids_str: any[]
  possibly_sensitive: boolean
  profile_banner_url: string
  profile_image_url_https: string
  profile_interstitial_type: string
  screen_name: string
  statuses_count: number
  translator_type: string
  url: string
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities4 {
  description: Description3
  url: Url6
}

interface Description3 {
  urls: any[]
}

interface Url6 {
  urls: Url7[]
}

interface Url7 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface TipjarSettings3 {}

interface ExtMediaAvailability2 {
  status: string
}

interface Sizes2 {
  large: Large3
  medium: Medium3
  small: Small3
  thumb: Thumb2
}

interface Large3 {
  h: number
  w: number
  resize: string
}

interface Medium3 {
  h: number
  w: number
  resize: string
}

interface Small3 {
  h: number
  w: number
  resize: string
}

interface Thumb2 {
  h: number
  w: number
  resize: string
}

interface OriginalInfo2 {
  height: number
  width: number
  focus_rects: FocusRect2[]
}

interface FocusRect2 {
  x: number
  y: number
  w: number
  h: number
}

interface AllowDownloadStatus2 {
  allow_download: boolean
}

interface VideoInfo2 {
  aspect_ratio: number[]
  duration_millis: number
  variants: Variant2[]
}

interface Variant2 {
  content_type: string
  url: string
  bitrate?: number
}

interface MediaResults2 {
  result: Result6
}

interface Result6 {
  media_key: string
}

interface Features2 {
  large: Large4
  medium: Medium4
  small: Small4
  orig: Orig2
}

interface Large4 {
  faces: any[]
}

interface Medium4 {
  faces: any[]
}

interface Small4 {
  faces: any[]
}

interface Orig2 {
  faces: any[]
}

interface ResponseObjects {
  feedbackActions: any[]
  immediateReactions: any[]
}
