/**
 * The raw data received when fetching the liked tweets of the given user.
 *
 * @public
 */
export interface IUserLikesResponse {
  data: Data
}

interface Data {
  user: User
}

interface User {
  result: Result
}

interface Result {
  __typename: string
  timeline_v2: TimelineV2
}

interface TimelineV2 {
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
  itemContent?: ItemContent
  value?: string
  cursorType?: string
  stopOnEmptyResponse?: boolean
}

interface ItemContent {
  itemType: string
  tweet_results: TweetResults
  tweetDisplayType: string
}

interface TweetResults {
  result: Result2
}

interface Result2 {
  __typename: string
  rest_id: string
  core: Core
  legacy: Legacy2
  card?: Card
  quoted_status_result?: QuotedStatusResult
}

interface Core {
  user_results: UserResults
}

interface UserResults {
  result: Result3
}

interface Result3 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel
  has_nft_avatar: boolean
  legacy: Legacy
  professional?: Professional
}

interface AffiliatesHighlightedLabel {}

interface Legacy {
  blocked_by: boolean
  blocking: boolean
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities
  fast_followers_count: number
  favourites_count: number
  follow_request_sent: boolean
  followed_by: boolean
  followers_count: number
  following: boolean
  friends_count: number
  has_custom_timelines: boolean
  is_translator: boolean
  listed_count: number
  location: string
  media_count: number
  muting: boolean
  name: string
  normal_followers_count: number
  notifications: boolean
  pinned_tweet_ids_str: string[]
  profile_banner_extensions: ProfileBannerExtensions
  profile_banner_url: string
  profile_image_extensions: ProfileImageExtensions
  profile_image_url_https: string
  profile_interstitial_type: string
  protected: boolean
  screen_name: string
  statuses_count: number
  translator_type: string
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: any[]
  url?: string
}

interface Entities {
  description: Description
  url?: Url2
}

interface Description {
  urls: Url[]
}

interface Url {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
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

interface ProfileBannerExtensions {
  mediaColor: MediaColor
}

interface MediaColor {
  r: R
}

interface R {
  ok: Ok
}

interface Ok {
  palette: Palette[]
}

interface Palette {
  percentage: number
  rgb: Rgb
}

interface Rgb {
  blue: number
  green: number
  red: number
}

interface ProfileImageExtensions {
  mediaColor: MediaColor2
}

interface MediaColor2 {
  r: R2
}

interface R2 {
  ok: Ok2
}

interface Ok2 {
  palette: Palette2[]
}

interface Palette2 {
  percentage: number
  rgb: Rgb2
}

interface Rgb2 {
  blue: number
  green: number
  red: number
}

interface Professional {
  rest_id: string
  professional_type: string
  category: Category[]
}

interface Category {
  id: number
  name: string
}

interface Legacy2 {
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities2
  extended_entities?: ExtendedEntities
  favorite_count: number
  favorited: boolean
  full_text: string
  is_quote_status: boolean
  lang: string
  possibly_sensitive?: boolean
  possibly_sensitive_editable?: boolean
  quote_count: number
  reply_count: number
  retweet_count: number
  retweeted: boolean
  source: string
  user_id_str: string
  id_str: string
  in_reply_to_screen_name?: string
  in_reply_to_status_id_str?: string
  in_reply_to_user_id_str?: string
  quoted_status_id_str?: string
  quoted_status_permalink?: QuotedStatusPermalink
  self_thread?: SelfThread
}

interface Entities2 {
  media?: Medum[]
  user_mentions: UserMention[]
  urls: Url4[]
  hashtags: Hashtag[]
  symbols: any[]
}

interface Medum {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_url_https: string
  type: string
  url: string
  features: Features
  sizes: Sizes
  original_info: OriginalInfo
  source_status_id_str?: string
  source_user_id_str?: string
}

interface Features {
  large?: Large
  medium?: Medium
  small?: Small
  orig?: Orig
  all?: All
}

interface Large {
  faces: Face[]
}

interface Face {
  x: number
  y: number
  h: number
  w: number
}

interface Medium {
  faces: Face2[]
}

interface Face2 {
  x: number
  y: number
  h: number
  w: number
}

interface Small {
  faces: Face3[]
}

interface Face3 {
  x: number
  y: number
  h: number
  w: number
}

interface Orig {
  faces: Face4[]
}

interface Face4 {
  x: number
  y: number
  h: number
  w: number
}

interface All {
  tags: Tag[]
}

interface Tag {
  user_id: string
  name: string
  screen_name: string
  type: string
}

interface Sizes {
  large: Large2
  medium: Medium2
  small: Small2
  thumb: Thumb
}

interface Large2 {
  h: number
  w: number
  resize: string
}

interface Medium2 {
  h: number
  w: number
  resize: string
}

interface Small2 {
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
  focus_rects?: FocusRect[]
}

interface FocusRect {
  x: number
  y: number
  w: number
  h: number
}

interface UserMention {
  id_str: string
  name: string
  screen_name: string
  indices: number[]
}

interface Url4 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Hashtag {
  indices: number[]
  text: string
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
  type: string
  url: string
  ext_media_color: ExtMediaColor
  ext_media_availability: ExtMediaAvailability
  features: Features2
  sizes: Sizes2
  original_info: OriginalInfo2
  additional_media_info?: AdditionalMediaInfo
  mediaStats?: MediaStats
  video_info?: VideoInfo
  source_status_id_str?: string
  source_user_id_str?: string
}

interface ExtMediaColor {
  palette: Palette3[]
}

interface Palette3 {
  percentage: number
  rgb: Rgb3
}

interface Rgb3 {
  blue: number
  green: number
  red: number
}

interface ExtMediaAvailability {
  status: string
}

interface Features2 {
  large?: Large3
  medium?: Medium3
  small?: Small3
  orig?: Orig2
  all?: All2
}

interface Large3 {
  faces: Face5[]
}

interface Face5 {
  x: number
  y: number
  h: number
  w: number
}

interface Medium3 {
  faces: Face6[]
}

interface Face6 {
  x: number
  y: number
  h: number
  w: number
}

interface Small3 {
  faces: Face7[]
}

interface Face7 {
  x: number
  y: number
  h: number
  w: number
}

interface Orig2 {
  faces: Face8[]
}

interface Face8 {
  x: number
  y: number
  h: number
  w: number
}

interface All2 {
  tags: Tag2[]
}

interface Tag2 {
  user_id: string
  name: string
  screen_name: string
  type: string
}

interface Sizes2 {
  large: Large4
  medium: Medium4
  small: Small4
  thumb: Thumb2
}

interface Large4 {
  h: number
  w: number
  resize: string
}

interface Medium4 {
  h: number
  w: number
  resize: string
}

interface Small4 {
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
  focus_rects?: FocusRect2[]
}

interface FocusRect2 {
  x: number
  y: number
  w: number
  h: number
}

interface AdditionalMediaInfo {
  monetizable: boolean
  source_user?: SourceUser
}

interface SourceUser {
  user_results: UserResults2
}

interface UserResults2 {
  result: Result4
}

interface Result4 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel2
  has_nft_avatar: boolean
  legacy: Legacy3
}

interface AffiliatesHighlightedLabel2 {}

interface Legacy3 {
  blocked_by: boolean
  blocking: boolean
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities3
  fast_followers_count: number
  favourites_count: number
  follow_request_sent: boolean
  followed_by: boolean
  followers_count: number
  following: boolean
  friends_count: number
  has_custom_timelines: boolean
  is_translator: boolean
  listed_count: number
  location: string
  media_count: number
  muting: boolean
  name: string
  normal_followers_count: number
  notifications: boolean
  pinned_tweet_ids_str: string[]
  profile_banner_extensions: ProfileBannerExtensions2
  profile_banner_url: string
  profile_image_extensions: ProfileImageExtensions2
  profile_image_url_https: string
  profile_interstitial_type: string
  protected: boolean
  screen_name: string
  statuses_count: number
  translator_type: string
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities3 {
  description: Description2
}

interface Description2 {
  urls: any[]
}

interface ProfileBannerExtensions2 {
  mediaColor: MediaColor3
}

interface MediaColor3 {
  r: R3
}

interface R3 {
  ok?: Ok3
}

interface Ok3 {
  palette: Palette4[]
}

interface Palette4 {
  percentage: number
  rgb: Rgb4
}

interface Rgb4 {
  blue: number
  green: number
  red: number
}

interface ProfileImageExtensions2 {
  mediaColor: MediaColor4
}

interface MediaColor4 {
  r: R4
}

interface R4 {
  ok: Ok4
}

interface Ok4 {
  palette: Palette5[]
}

interface Palette5 {
  percentage: number
  rgb: Rgb5
}

interface Rgb5 {
  blue: number
  green: number
  red: number
}

interface MediaStats {
  viewCount: number
}

interface VideoInfo {
  aspect_ratio: number[]
  duration_millis: number
  variants: Variant[]
}

interface Variant {
  bitrate?: number
  content_type: string
  url: string
}

interface QuotedStatusPermalink {
  url: string
  expanded: string
  display: string
}

interface SelfThread {
  id_str: string
}

interface Card {
  rest_id: string
  legacy: Legacy4
}

interface Legacy4 {
  binding_values: BindingValue[]
  card_platform: CardPlatform
  name: string
  url: string
  user_refs: UserRef[]
}

interface BindingValue {
  key: string
  value: Value
}

interface Value {
  image_value?: ImageValue
  type: string
  string_value?: string
  scribe_key?: string
  user_value?: UserValue
  image_color_value?: ImageColorValue
}

interface ImageValue {
  alt: string
  height: number
  width: number
  url: string
}

interface UserValue {
  id_str: string
  path: any[]
}

interface ImageColorValue {
  palette: Palette6[]
}

interface Palette6 {
  rgb: Rgb6
  percentage: number
}

interface Rgb6 {
  blue: number
  green: number
  red: number
}

interface CardPlatform {
  platform: Platform
}

interface Platform {
  audience: Audience
  device: Device
}

interface Audience {
  name: string
}

interface Device {
  name: string
  version: string
}

interface UserRef {
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel3
  has_nft_avatar: boolean
  legacy: Legacy5
}

interface AffiliatesHighlightedLabel3 {}

interface Legacy5 {
  blocked_by: boolean
  blocking: boolean
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities4
  fast_followers_count: number
  favourites_count: number
  follow_request_sent: boolean
  followed_by: boolean
  followers_count: number
  following: boolean
  friends_count: number
  has_custom_timelines: boolean
  is_translator: boolean
  listed_count: number
  location: string
  media_count: number
  muting: boolean
  name: string
  normal_followers_count: number
  notifications: boolean
  pinned_tweet_ids_str: any[]
  profile_banner_extensions: ProfileBannerExtensions3
  profile_banner_url: string
  profile_image_extensions: ProfileImageExtensions3
  profile_image_url_https: string
  profile_interstitial_type: string
  protected: boolean
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
  url: Url5
}

interface Description3 {
  urls: any[]
}

interface Url5 {
  urls: Url6[]
}

interface Url6 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface ProfileBannerExtensions3 {
  mediaColor: MediaColor5
}

interface MediaColor5 {
  r: R5
}

interface R5 {
  ok: Ok5
}

interface Ok5 {
  palette: Palette7[]
}

interface Palette7 {
  percentage: number
  rgb: Rgb7
}

interface Rgb7 {
  blue: number
  green: number
  red: number
}

interface ProfileImageExtensions3 {
  mediaColor: MediaColor6
}

interface MediaColor6 {
  r: R6
}

interface R6 {
  ok: Ok6
}

interface Ok6 {
  palette: Palette8[]
}

interface Palette8 {
  percentage: number
  rgb: Rgb8
}

interface Rgb8 {
  blue: number
  green: number
  red: number
}

interface QuotedStatusResult {
  result: Result5
}

interface Result5 {
  __typename: string
  rest_id: string
  core: Core2
  legacy: Legacy7
}

interface Core2 {
  user_results: UserResults3
}

interface UserResults3 {
  result: Result6
}

interface Result6 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel4
  has_nft_avatar: boolean
  legacy: Legacy6
  professional?: Professional2
}

interface AffiliatesHighlightedLabel4 {}

interface Legacy6 {
  blocked_by: boolean
  blocking: boolean
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities5
  fast_followers_count: number
  favourites_count: number
  follow_request_sent: boolean
  followed_by: boolean
  followers_count: number
  following: boolean
  friends_count: number
  has_custom_timelines: boolean
  is_translator: boolean
  listed_count: number
  location: string
  media_count: number
  muting: boolean
  name: string
  normal_followers_count: number
  notifications: boolean
  pinned_tweet_ids_str: string[]
  profile_banner_extensions: ProfileBannerExtensions4
  profile_banner_url: string
  profile_image_extensions: ProfileImageExtensions4
  profile_image_url_https: string
  profile_interstitial_type: string
  protected: boolean
  screen_name: string
  statuses_count: number
  translator_type: string
  url: string
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities5 {
  description: Description4
  url: Url7
}

interface Description4 {
  urls: any[]
}

interface Url7 {
  urls: Url8[]
}

interface Url8 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface ProfileBannerExtensions4 {
  mediaColor: MediaColor7
}

interface MediaColor7 {
  r: R7
}

interface R7 {
  ok: Ok7
}

interface Ok7 {
  palette: Palette9[]
}

interface Palette9 {
  percentage: number
  rgb: Rgb9
}

interface Rgb9 {
  blue: number
  green: number
  red: number
}

interface ProfileImageExtensions4 {
  mediaColor: MediaColor8
}

interface MediaColor8 {
  r: R8
}

interface R8 {
  ok: Ok8
}

interface Ok8 {
  palette: Palette10[]
}

interface Palette10 {
  percentage: number
  rgb: Rgb10
}

interface Rgb10 {
  blue: number
  green: number
  red: number
}

interface Professional2 {
  rest_id: string
  professional_type: string
  category: Category2[]
}

interface Category2 {
  id: number
  name: string
}

interface Legacy7 {
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities6
  extended_entities?: ExtendedEntities2
  favorite_count: number
  favorited: boolean
  full_text: string
  is_quote_status: boolean
  lang: string
  possibly_sensitive?: boolean
  possibly_sensitive_editable?: boolean
  quote_count: number
  reply_count: number
  retweet_count: number
  retweeted: boolean
  source: string
  user_id_str: string
  id_str: string
}

interface Entities6 {
  media?: Medum3[]
  user_mentions: UserMention2[]
  urls: any[]
  hashtags: any[]
  symbols: any[]
}

interface Medum3 {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_url_https: string
  type: string
  url: string
  features: Features3
  sizes: Sizes3
  original_info: OriginalInfo3
}

interface Features3 {}

interface Sizes3 {
  large: Large5
  medium: Medium5
  small: Small5
  thumb: Thumb3
}

interface Large5 {
  h: number
  w: number
  resize: string
}

interface Medium5 {
  h: number
  w: number
  resize: string
}

interface Small5 {
  h: number
  w: number
  resize: string
}

interface Thumb3 {
  h: number
  w: number
  resize: string
}

interface OriginalInfo3 {
  height: number
  width: number
}

interface UserMention2 {
  id_str: string
  name: string
  screen_name: string
  indices: number[]
}

interface ExtendedEntities2 {
  media: Medum4[]
}

interface Medum4 {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_key: string
  media_url_https: string
  type: string
  url: string
  additional_media_info: AdditionalMediaInfo2
  ext_media_color: ExtMediaColor2
  mediaStats: MediaStats2
  ext_media_availability: ExtMediaAvailability2
  features: Features4
  sizes: Sizes4
  original_info: OriginalInfo4
  video_info: VideoInfo2
}

interface AdditionalMediaInfo2 {
  monetizable: boolean
}

interface ExtMediaColor2 {
  palette: Palette11[]
}

interface Palette11 {
  percentage: number
  rgb: Rgb11
}

interface Rgb11 {
  blue: number
  green: number
  red: number
}

interface MediaStats2 {
  viewCount: number
}

interface ExtMediaAvailability2 {
  status: string
}

interface Features4 {}

interface Sizes4 {
  large: Large6
  medium: Medium6
  small: Small6
  thumb: Thumb4
}

interface Large6 {
  h: number
  w: number
  resize: string
}

interface Medium6 {
  h: number
  w: number
  resize: string
}

interface Small6 {
  h: number
  w: number
  resize: string
}

interface Thumb4 {
  h: number
  w: number
  resize: string
}

interface OriginalInfo4 {
  height: number
  width: number
}

interface VideoInfo2 {
  aspect_ratio: number[]
  duration_millis: number
  variants: Variant2[]
}

interface Variant2 {
  bitrate?: number
  content_type: string
  url: string
}

interface ResponseObjects {
  feedbackActions: any[]
  immediateReactions: any[]
}
