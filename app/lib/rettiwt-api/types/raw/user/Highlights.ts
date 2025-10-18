/**
 * The raw data received when fetching the highlights of the given user.
 *
 * @public
 */
export interface IUserHighlightsResponse {
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
  timeline: Timeline
}

interface Timeline {
  timeline: Timeline2
}

interface Timeline2 {
  instructions: Instruction[]
  metadata: Metadata
}

interface Instruction {
  type: string
  entries?: Entry[]
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
  clientEventInfo?: ClientEventInfo
  value?: string
  cursorType?: string
}

interface ItemContent {
  itemType: string
  __typename: string
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
  unmention_data: UnmentionData
  edit_control: EditControl
  is_translatable: boolean
  views: Views
  source: string
  legacy: Legacy2
  superFollowsReplyUserResult?: SuperFollowsReplyUserResult
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
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy
  professional: Professional
  super_follow_eligible: boolean
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel {
  label: Label
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
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities {
  description: Description
}

interface Description {
  urls: any[]
}

interface Professional {
  rest_id: string
  professional_type: string
  category: any[]
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
  favorite_count: number
  favorited: boolean
  full_text: string
  in_reply_to_screen_name?: string
  in_reply_to_status_id_str?: string
  in_reply_to_user_id_str?: string
  is_quote_status: boolean
  lang: string
  quote_count: number
  reply_count: number
  retweet_count: number
  retweeted: boolean
  user_id_str: string
  id_str: string
  quoted_status_id_str?: string
  quoted_status_permalink?: QuotedStatusPermalink
  extended_entities?: ExtendedEntities
  possibly_sensitive?: boolean
  possibly_sensitive_editable?: boolean
}

interface Entities2 {
  hashtags: any[]
  symbols: any[]
  timestamps: any[]
  urls: any[]
  user_mentions: UserMention[]
  media?: Medum[]
}

interface UserMention {
  id_str: string
  name: string
  screen_name: string
  indices: number[]
}

interface Medum {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_key: string
  media_url_https: string
  source_status_id_str: string
  source_user_id_str: string
  type: string
  url: string
  additional_media_info: AdditionalMediaInfo
  ext_media_availability: ExtMediaAvailability
  sizes: Sizes
  original_info: OriginalInfo
  allow_download_status: AllowDownloadStatus
  video_info: VideoInfo
  media_results: MediaResults
}

interface AdditionalMediaInfo {
  monetizable: boolean
  source_user: SourceUser
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
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy3
  professional: Professional2
  super_follow_eligible: boolean
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel2 {}

interface Legacy3 {
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
  pinned_tweet_ids_str: string[]
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
  url: Url3
}

interface Description2 {
  urls: Url2[]
}

interface Url2 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Url3 {
  urls: Url4[]
}

interface Url4 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Professional2 {
  rest_id: string
  professional_type: string
  category: any[]
}

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
  focus_rects: any[]
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
  bitrate?: number
  content_type: string
  url: string
}

interface MediaResults {
  result: Result5
}

interface Result5 {
  media_key: string
}

interface QuotedStatusPermalink {
  url: string
  expanded: string
  display: string
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
  source_status_id_str: string
  source_user_id_str: string
  type: string
  url: string
  additional_media_info: AdditionalMediaInfo2
  ext_media_availability: ExtMediaAvailability2
  sizes: Sizes2
  original_info: OriginalInfo2
  allow_download_status: AllowDownloadStatus2
  video_info: VideoInfo2
  media_results: MediaResults2
}

interface AdditionalMediaInfo2 {
  monetizable: boolean
  source_user: SourceUser2
}

interface SourceUser2 {
  user_results: UserResults3
}

interface UserResults3 {
  result: Result6
}

interface Result6 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel3
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy4
  professional: Professional3
  super_follow_eligible: boolean
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel3 {}

interface Legacy4 {
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
  pinned_tweet_ids_str: string[]
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
  urls: Url5[]
}

interface Url5 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
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

interface Professional3 {
  rest_id: string
  professional_type: string
  category: any[]
}

interface ExtMediaAvailability2 {
  status: string
}

interface Sizes2 {
  large: Large2
  medium: Medium2
  small: Small2
  thumb: Thumb2
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

interface Thumb2 {
  h: number
  w: number
  resize: string
}

interface OriginalInfo2 {
  height: number
  width: number
  focus_rects: any[]
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
  bitrate?: number
  content_type: string
  url: string
}

interface MediaResults2 {
  result: Result7
}

interface Result7 {
  media_key: string
}

interface SuperFollowsReplyUserResult {
  result: Result8
}

interface Result8 {
  __typename: string
  legacy: Legacy5
}

interface Legacy5 {
  screen_name: string
}

interface QuotedStatusResult {
  result: Result9
}

interface Result9 {
  __typename: string
  rest_id: string
  core: Core2
  unmention_data: UnmentionData2
  edit_control: EditControl2
  is_translatable: boolean
  views: Views2
  source: string
  legacy: Legacy7
  card?: Card
  note_tweet?: NoteTweet
  quotedRefResult?: QuotedRefResult
}

interface Core2 {
  user_results: UserResults4
}

interface UserResults4 {
  result: Result10
}

interface Result10 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel4
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy6
  verified_phone_status: boolean
  professional?: Professional4
  super_follow_eligible?: boolean
}

interface AffiliatesHighlightedLabel4 {
  label?: Label2
}

interface Label2 {
  url: Url8
  badge: Badge2
  description: string
  userLabelType: string
  userLabelDisplayType: string
}

interface Url8 {
  url: string
  urlType: string
}

interface Badge2 {
  url: string
}

interface Legacy6 {
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities5
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
  following?: boolean
  verified_type?: string
}

interface Entities5 {
  description: Description4
  url?: Url10
}

interface Description4 {
  urls: Url9[]
}

interface Url9 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Url10 {
  urls: Url11[]
}

interface Url11 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Professional4 {
  rest_id: string
  professional_type: string
  category: any[]
}

interface UnmentionData2 {}

interface EditControl2 {
  edit_tweet_ids: string[]
  editable_until_msecs: string
  is_edit_eligible: boolean
  edits_remaining: string
}

interface Views2 {
  count: string
  state: string
}

interface Legacy7 {
  bookmark_count: number
  bookmarked: boolean
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
  user_id_str: string
  id_str: string
  quoted_status_id_str?: string
  quoted_status_permalink?: QuotedStatusPermalink2
  in_reply_to_screen_name?: string
  in_reply_to_status_id_str?: string
  in_reply_to_user_id_str?: string
}

interface Entities6 {
  hashtags: any[]
  media?: Medum3[]
  symbols: any[]
  timestamps: any[]
  urls: Url12[]
  user_mentions: UserMention2[]
}

interface Medum3 {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_key: string
  media_url_https: string
  type: string
  url: string
  additional_media_info?: AdditionalMediaInfo3
  ext_media_availability: ExtMediaAvailability3
  sizes: Sizes3
  original_info: OriginalInfo3
  allow_download_status?: AllowDownloadStatus3
  video_info?: VideoInfo3
  media_results: MediaResults3
  features?: Features
}

interface AdditionalMediaInfo3 {
  title?: string
  description?: string
  embeddable?: boolean
  monetizable: boolean
}

interface ExtMediaAvailability3 {
  status: string
}

interface Sizes3 {
  large: Large3
  medium: Medium3
  small: Small3
  thumb: Thumb3
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

interface Thumb3 {
  h: number
  w: number
  resize: string
}

interface OriginalInfo3 {
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

interface AllowDownloadStatus3 {
  allow_download: boolean
}

interface VideoInfo3 {
  aspect_ratio: number[]
  duration_millis: number
  variants: Variant3[]
}

interface Variant3 {
  content_type: string
  url: string
  bitrate?: number
}

interface MediaResults3 {
  result: Result11
}

interface Result11 {
  media_key: string
}

interface Features {
  large: Large4
  medium: Medium4
  small: Small4
  orig: Orig
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

interface Orig {
  faces: any[]
}

interface Url12 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
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
  additional_media_info?: AdditionalMediaInfo4
  ext_media_availability: ExtMediaAvailability4
  sizes: Sizes4
  original_info: OriginalInfo4
  allow_download_status?: AllowDownloadStatus4
  video_info?: VideoInfo4
  media_results: MediaResults4
  features?: Features2
}

interface AdditionalMediaInfo4 {
  title?: string
  description?: string
  embeddable?: boolean
  monetizable: boolean
}

interface ExtMediaAvailability4 {
  status: string
}

interface Sizes4 {
  large: Large5
  medium: Medium5
  small: Small5
  thumb: Thumb4
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

interface Thumb4 {
  h: number
  w: number
  resize: string
}

interface OriginalInfo4 {
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

interface AllowDownloadStatus4 {
  allow_download: boolean
}

interface VideoInfo4 {
  aspect_ratio: number[]
  duration_millis: number
  variants: Variant4[]
}

interface Variant4 {
  content_type: string
  url: string
  bitrate?: number
}

interface MediaResults4 {
  result: Result12
}

interface Result12 {
  media_key: string
}

interface Features2 {
  large: Large6
  medium: Medium6
  small: Small6
  orig: Orig2
}

interface Large6 {
  faces: any[]
}

interface Medium6 {
  faces: any[]
}

interface Small6 {
  faces: any[]
}

interface Orig2 {
  faces: any[]
}

interface QuotedStatusPermalink2 {
  url: string
  expanded: string
  display: string
}

interface Card {
  rest_id: string
  legacy: Legacy8
}

interface Legacy8 {
  binding_values: BindingValue[]
  card_platform: CardPlatform
  name: string
  url: string
  user_refs_results: UserRefsResult[]
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
  palette: Palette[]
}

interface Palette {
  rgb: Rgb
  percentage: number
}

interface Rgb {
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

interface UserRefsResult {
  result: Result13
}

interface Result13 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel5
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy9
  professional: Professional5
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel5 {}

interface Legacy9 {
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities7
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
  verified_type: string
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities7 {
  description: Description5
  url: Url14
}

interface Description5 {
  urls: Url13[]
}

interface Url13 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Url14 {
  urls: Url15[]
}

interface Url15 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Professional5 {
  rest_id: string
  professional_type: string
  category: Category[]
}

interface Category {
  id: number
  name: string
  icon_name: string
}

interface NoteTweet {
  is_expandable: boolean
  note_tweet_results: NoteTweetResults
}

interface NoteTweetResults {
  result: Result14
}

interface Result14 {
  id: string
  text: string
  entity_set: EntitySet
  richtext: Richtext
  media: Media
}

interface EntitySet {
  hashtags: any[]
  symbols: any[]
  timestamps: any[]
  urls: any[]
  user_mentions: UserMention3[]
}

interface UserMention3 {
  id_str: string
  name: string
  screen_name: string
  indices: number[]
}

interface Richtext {
  richtext_tags: RichtextTag[]
}

interface RichtextTag {
  from_index: number
  to_index: number
  richtext_types: string[]
}

interface Media {
  inline_media: any[]
}

interface QuotedRefResult {
  result: Result15
}

interface Result15 {
  __typename: string
  rest_id: string
}

interface ClientEventInfo {
  component: string
  element: string
}

interface Metadata {
  scribeConfig: ScribeConfig
}

interface ScribeConfig {
  page: string
}
