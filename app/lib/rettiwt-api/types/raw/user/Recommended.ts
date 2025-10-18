/**
 * The raw data received when fetching the recommended timeline of the given user.
 *
 * @public
 */
export interface IUserRecommendedResponse {
  data: Data
}

interface Data {
  home: Home
}

interface Home {
  home_timeline_urt: HomeTimelineUrt
}

interface HomeTimelineUrt {
  instructions: Instruction[]
  responseObjects: ResponseObjects
  metadata: Metadata
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
  feedbackInfo?: FeedbackInfo
  clientEventInfo?: ClientEventInfo
  value?: string
  cursorType?: string
}

interface ItemContent {
  itemType: string
  __typename: string
  tweet_results: TweetResults
  tweetDisplayType: string
  promotedMetadata?: PromotedMetadata
}

interface TweetResults {
  result: Result
}

interface Result {
  __typename: string
  rest_id?: string
  core?: Core
  unmention_data?: UnmentionData
  edit_control?: EditControl
  is_translatable?: boolean
  views?: Views
  source?: string
  legacy?: Legacy2
  card?: Card
  tweet?: Tweet
  limitedActionResults?: LimitedActionResults
  quoted_status_result?: QuotedStatusResult
  note_tweet?: NoteTweet
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
  tipjar_settings: TipjarSettings
  verified_phone_status: boolean
  professional?: Professional
  super_follow_eligible?: boolean
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
  following?: boolean
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
  verified_type?: string
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities {
  description: Description
  url?: Url3
}

interface Description {
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

interface TipjarSettings {}

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
  user_id_str: string
  id_str: string
  retweeted_status_result?: RetweetedStatusResult
  quoted_status_id_str?: string
  quoted_status_permalink?: QuotedStatusPermalink
  scopes?: Scopes
}

interface Entities2 {
  hashtags: Hashtag[]
  media?: Medum[]
  symbols: any[]
  timestamps: any[]
  urls: Url7[]
  user_mentions: UserMention[]
}

interface Hashtag {
  indices: number[]
  text: string
}

interface Medum {
  display_url: string
  expanded_url: string
  ext_alt_text?: string
  id_str: string
  indices: number[]
  media_key: string
  media_url_https: string
  type: string
  url: string
  ext_media_availability: ExtMediaAvailability
  features?: Features
  sizes: Sizes
  original_info: OriginalInfo
  media_results: MediaResults
  additional_media_info?: AdditionalMediaInfo
  video_info?: VideoInfo
  source_status_id_str?: string
  source_user_id_str?: string
  allow_download_status?: AllowDownloadStatus
}

interface ExtMediaAvailability {
  status: string
}

interface Features {
  large: Large
  medium: Medium
  small: Small
  orig: Orig
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
  focus_rects: FocusRect[]
}

interface FocusRect {
  x: number
  y: number
  w: number
  h: number
}

interface MediaResults {
  result: Result3
}

interface Result3 {
  media_key: string
}

interface AdditionalMediaInfo {
  monetizable: boolean
  source_user?: SourceUser
  title?: string
  description?: string
  embeddable?: boolean
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
  tipjar_settings: TipjarSettings2
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
  url: Url5
}

interface Description2 {
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

interface Professional2 {
  rest_id: string
  professional_type: string
  category: any[]
}

interface TipjarSettings2 {}

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

interface AllowDownloadStatus {
  allow_download: boolean
}

interface Url7 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface UserMention {
  id_str: string
  name: string
  screen_name: string
  indices: number[]
}

interface ExtendedEntities {
  media: Medum2[]
}

interface Medum2 {
  display_url: string
  expanded_url: string
  ext_alt_text?: string
  id_str: string
  indices: number[]
  media_key: string
  media_url_https: string
  type: string
  url: string
  ext_media_availability: ExtMediaAvailability2
  features?: Features2
  sizes: Sizes2
  original_info: OriginalInfo2
  media_results: MediaResults2
  additional_media_info?: AdditionalMediaInfo2
  video_info?: VideoInfo2
  source_status_id_str?: string
  source_user_id_str?: string
  allow_download_status?: AllowDownloadStatus2
}

interface ExtMediaAvailability2 {
  status: string
}

interface Features2 {
  large: Large3
  medium: Medium3
  small: Small3
  orig: Orig2
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
  focus_rects: FocusRect2[]
}

interface FocusRect2 {
  x: number
  y: number
  w: number
  h: number
}

interface MediaResults2 {
  result: Result5
}

interface Result5 {
  media_key: string
}

interface AdditionalMediaInfo2 {
  monetizable: boolean
  source_user?: SourceUser2
  title?: string
  description?: string
  embeddable?: boolean
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
  tipjar_settings: TipjarSettings3
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
  url: Url8
}

interface Description3 {
  urls: any[]
}

interface Url8 {
  urls: Url9[]
}

interface Url9 {
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

interface TipjarSettings3 {}

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

interface AllowDownloadStatus2 {
  allow_download: boolean
}

interface RetweetedStatusResult {
  result: Result7
}

interface Result7 {
  __typename: string
  rest_id: string
  core: Core2
  unmention_data: UnmentionData2
  edit_control: EditControl2
  is_translatable: boolean
  views: Views2
  source: string
  legacy: Legacy6
}

interface Core2 {
  user_results: UserResults4
}

interface UserResults4 {
  result: Result8
}

interface Result8 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel4
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy5
  professional?: Professional4
  tipjar_settings: TipjarSettings4
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel4 {
  label?: Label2
}

interface Label2 {
  url: Url10
  badge: Badge2
  description: string
  userLabelType: string
  userLabelDisplayType: string
}

interface Url10 {
  url: string
  urlType: string
}

interface Badge2 {
  url: string
}

interface Legacy5 {
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
  verified_type?: string
}

interface Entities5 {
  description: Description4
  url: Url11
}

interface Description4 {
  urls: any[]
}

interface Url11 {
  urls: Url12[]
}

interface Url12 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Professional4 {
  rest_id: string
  professional_type: string
  category: Category2[]
}

interface Category2 {
  id: number
  name: string
  icon_name: string
}

interface TipjarSettings4 {}

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

interface Legacy6 {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities6
  extended_entities: ExtendedEntities2
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

interface Entities6 {
  hashtags: Hashtag2[]
  media: Medum3[]
  symbols: any[]
  timestamps: any[]
  urls: Url13[]
  user_mentions: any[]
}

interface Hashtag2 {
  indices: number[]
  text: string
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
  features?: Features3
}

interface AdditionalMediaInfo3 {
  monetizable: boolean
}

interface ExtMediaAvailability3 {
  status: string
}

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
  focus_rects: FocusRect3[]
}

interface FocusRect3 {
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
  result: Result9
}

interface Result9 {
  media_key: string
}

interface Features3 {
  large: Large6
  medium: Medium6
  small: Small6
  orig: Orig3
}

interface Large6 {
  faces: Face9[]
}

interface Face9 {
  x: number
  y: number
  h: number
  w: number
}

interface Medium6 {
  faces: Face10[]
}

interface Face10 {
  x: number
  y: number
  h: number
  w: number
}

interface Small6 {
  faces: Face11[]
}

interface Face11 {
  x: number
  y: number
  h: number
  w: number
}

interface Orig3 {
  faces: Face12[]
}

interface Face12 {
  x: number
  y: number
  h: number
  w: number
}

interface Url13 {
  display_url: string
  expanded_url: string
  url: string
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
  features?: Features4
}

interface AdditionalMediaInfo4 {
  monetizable: boolean
}

interface ExtMediaAvailability4 {
  status: string
}

interface Sizes4 {
  large: Large7
  medium: Medium7
  small: Small7
  thumb: Thumb4
}

interface Large7 {
  h: number
  w: number
  resize: string
}

interface Medium7 {
  h: number
  w: number
  resize: string
}

interface Small7 {
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
  focus_rects: FocusRect4[]
}

interface FocusRect4 {
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
  result: Result10
}

interface Result10 {
  media_key: string
}

interface Features4 {
  large: Large8
  medium: Medium8
  small: Small8
  orig: Orig4
}

interface Large8 {
  faces: Face13[]
}

interface Face13 {
  x: number
  y: number
  h: number
  w: number
}

interface Medium8 {
  faces: Face14[]
}

interface Face14 {
  x: number
  y: number
  h: number
  w: number
}

interface Small8 {
  faces: Face15[]
}

interface Face15 {
  x: number
  y: number
  h: number
  w: number
}

interface Orig4 {
  faces: Face16[]
}

interface Face16 {
  x: number
  y: number
  h: number
  w: number
}

interface QuotedStatusPermalink {
  url: string
  expanded: string
  display: string
}

interface Scopes {
  followers: boolean
}

interface Card {
  rest_id: string
  legacy: Legacy7
}

interface Legacy7 {
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
  image_color_value?: ImageColorValue
  user_value?: UserValue
}

interface ImageValue {
  height: number
  width: number
  url: string
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

interface UserValue {
  id_str: string
  path: any[]
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
  result: Result11
}

interface Result11 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel5
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy8
  professional?: Professional5
  tipjar_settings: TipjarSettings5
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel5 {}

interface Legacy8 {
  following: boolean
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
  verified_type?: string
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities7 {
  description: Description5
  url: Url14
}

interface Description5 {
  urls: any[]
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
  category: Category3[]
}

interface Category3 {
  id: number
  name: string
  icon_name: string
}

interface TipjarSettings5 {}

interface Tweet {
  rest_id: string
  core: Core3
  card: Card2
  unmention_data: UnmentionData3
  edit_control: EditControl3
  is_translatable: boolean
  views: Views3
  source: string
  legacy: Legacy11
}

interface Core3 {
  user_results: UserResults5
}

interface UserResults5 {
  result: Result12
}

interface Result12 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel6
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy9
  professional: Professional6
  tipjar_settings: TipjarSettings6
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel6 {}

interface Legacy9 {
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities8
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

interface Entities8 {
  description: Description6
  url: Url17
}

interface Description6 {
  urls: Url16[]
}

interface Url16 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Url17 {
  urls: Url18[]
}

interface Url18 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Professional6 {
  rest_id: string
  professional_type: string
  category: any[]
}

interface TipjarSettings6 {}

interface Card2 {
  rest_id: string
  legacy: Legacy10
}

interface Legacy10 {
  binding_values: BindingValue2[]
  card_platform: CardPlatform2
  name: string
  url: string
  user_refs_results: any[]
}

interface BindingValue2 {
  key: string
  value: Value2
}

interface Value2 {
  string_value: string
  type: string
  scribe_key?: string
}

interface CardPlatform2 {
  platform: Platform2
}

interface Platform2 {
  audience: Audience2
  device: Device2
}

interface Audience2 {
  name: string
}

interface Device2 {
  name: string
  version: string
}

interface UnmentionData3 {}

interface EditControl3 {
  edit_tweet_ids: string[]
  editable_until_msecs: string
  is_edit_eligible: boolean
  edits_remaining: string
}

interface Views3 {
  count: string
  state: string
}

interface Legacy11 {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_control: ConversationControl
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities9
  favorite_count: number
  favorited: boolean
  full_text: string
  is_quote_status: boolean
  lang: string
  limited_actions: string
  possibly_sensitive: boolean
  possibly_sensitive_editable: boolean
  quote_count: number
  reply_count: number
  retweet_count: number
  retweeted: boolean
  scopes: Scopes2
  user_id_str: string
  id_str: string
}

interface ConversationControl {
  policy: string
  conversation_owner_results: ConversationOwnerResults
}

interface ConversationOwnerResults {
  result: Result13
}

interface Result13 {
  __typename: string
  legacy: Legacy12
}

interface Legacy12 {
  screen_name: string
}

interface Entities9 {
  hashtags: any[]
  symbols: any[]
  timestamps: any[]
  urls: Url19[]
  user_mentions: any[]
}

interface Url19 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Scopes2 {
  followers: boolean
}

interface LimitedActionResults {
  limited_actions: LimitedAction[]
}

interface LimitedAction {
  action: string
  prompt: Prompt
}

interface Prompt {
  __typename: string
  cta_type: string
  headline: Headline
  subtext: Subtext
}

interface Headline {
  text: string
  entities: any[]
}

interface Subtext {
  text: string
  entities: any[]
}

interface QuotedStatusResult {
  result: Result14
}

interface Result14 {
  __typename: string
  rest_id: string
  core: Core4
  unmention_data: UnmentionData4
  edit_control: EditControl4
  is_translatable: boolean
  views: Views4
  source: string
  legacy: Legacy14
}

interface Core4 {
  user_results: UserResults6
}

interface UserResults6 {
  result: Result15
}

interface Result15 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel7
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy13
  professional?: Professional7
  tipjar_settings: TipjarSettings7
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel7 {
  label?: Label3
}

interface Label3 {
  url: Url20
  badge: Badge3
  description: string
  userLabelType: string
  userLabelDisplayType: string
}

interface Url20 {
  url: string
  urlType: string
}

interface Badge3 {
  url: string
}

interface Legacy13 {
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities10
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
  verified_type?: string
}

interface Entities10 {
  description: Description7
  url: Url22
}

interface Description7 {
  urls: Url21[]
}

interface Url21 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Url22 {
  urls: Url23[]
}

interface Url23 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Professional7 {
  rest_id: string
  professional_type: string
  category: Category4[]
}

interface Category4 {
  id: number
  name: string
  icon_name: string
}

interface TipjarSettings7 {
  is_enabled?: boolean
}

interface UnmentionData4 {}

interface EditControl4 {
  edit_tweet_ids: string[]
  editable_until_msecs: string
  is_edit_eligible: boolean
  edits_remaining: string
}

interface Views4 {
  count: string
  state: string
}

interface Legacy14 {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities11
  extended_entities: ExtendedEntities3
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

interface Entities11 {
  hashtags: Hashtag3[]
  media: Medum5[]
  symbols: any[]
  timestamps: any[]
  urls: Url24[]
  user_mentions: UserMention2[]
}

interface Hashtag3 {
  indices: number[]
  text: string
}

interface Medum5 {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_key: string
  media_url_https: string
  type: string
  url: string
  ext_media_availability: ExtMediaAvailability5
  features: Features5
  sizes: Sizes5
  original_info: OriginalInfo5
  allow_download_status?: AllowDownloadStatus5
  media_results: MediaResults5
  ext_alt_text?: string
}

interface ExtMediaAvailability5 {
  status: string
}

interface Features5 {
  large: Large9
  medium: Medium9
  small: Small9
  orig: Orig5
}

interface Large9 {
  faces: Face17[]
}

interface Face17 {
  x: number
  y: number
  h: number
  w: number
}

interface Medium9 {
  faces: Face18[]
}

interface Face18 {
  x: number
  y: number
  h: number
  w: number
}

interface Small9 {
  faces: Face19[]
}

interface Face19 {
  x: number
  y: number
  h: number
  w: number
}

interface Orig5 {
  faces: Face20[]
}

interface Face20 {
  x: number
  y: number
  h: number
  w: number
}

interface Sizes5 {
  large: Large10
  medium: Medium10
  small: Small10
  thumb: Thumb5
}

interface Large10 {
  h: number
  w: number
  resize: string
}

interface Medium10 {
  h: number
  w: number
  resize: string
}

interface Small10 {
  h: number
  w: number
  resize: string
}

interface Thumb5 {
  h: number
  w: number
  resize: string
}

interface OriginalInfo5 {
  height: number
  width: number
  focus_rects: FocusRect5[]
}

interface FocusRect5 {
  x: number
  y: number
  w: number
  h: number
}

interface AllowDownloadStatus5 {
  allow_download: boolean
}

interface MediaResults5 {
  result: Result16
}

interface Result16 {
  media_key: string
}

interface Url24 {
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

interface ExtendedEntities3 {
  media: Medum6[]
}

interface Medum6 {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_key: string
  media_url_https: string
  type: string
  url: string
  ext_media_availability: ExtMediaAvailability6
  features: Features6
  sizes: Sizes6
  original_info: OriginalInfo6
  allow_download_status?: AllowDownloadStatus6
  media_results: MediaResults6
  ext_alt_text?: string
}

interface ExtMediaAvailability6 {
  status: string
}

interface Features6 {
  large: Large11
  medium: Medium11
  small: Small11
  orig: Orig6
}

interface Large11 {
  faces: Face21[]
}

interface Face21 {
  x: number
  y: number
  h: number
  w: number
}

interface Medium11 {
  faces: Face22[]
}

interface Face22 {
  x: number
  y: number
  h: number
  w: number
}

interface Small11 {
  faces: Face23[]
}

interface Face23 {
  x: number
  y: number
  h: number
  w: number
}

interface Orig6 {
  faces: Face24[]
}

interface Face24 {
  x: number
  y: number
  h: number
  w: number
}

interface Sizes6 {
  large: Large12
  medium: Medium12
  small: Small12
  thumb: Thumb6
}

interface Large12 {
  h: number
  w: number
  resize: string
}

interface Medium12 {
  h: number
  w: number
  resize: string
}

interface Small12 {
  h: number
  w: number
  resize: string
}

interface Thumb6 {
  h: number
  w: number
  resize: string
}

interface OriginalInfo6 {
  height: number
  width: number
  focus_rects: FocusRect6[]
}

interface FocusRect6 {
  x: number
  y: number
  w: number
  h: number
}

interface AllowDownloadStatus6 {
  allow_download: boolean
}

interface MediaResults6 {
  result: Result17
}

interface Result17 {
  media_key: string
}

interface NoteTweet {
  is_expandable: boolean
  note_tweet_results: NoteTweetResults
}

interface NoteTweetResults {
  result: Result18
}

interface Result18 {
  id: string
  text: string
  entity_set: EntitySet
}

interface EntitySet {
  hashtags: any[]
  symbols: any[]
  urls: any[]
  user_mentions: any[]
}

interface PromotedMetadata {
  advertiser_results: AdvertiserResults
  adMetadataContainer: AdMetadataContainer
  disclosureType: string
  experimentValues: ExperimentValue[]
  impressionId: string
  impressionString: string
  clickTrackingInfo: ClickTrackingInfo
}

interface AdvertiserResults {
  result: Result19
}

interface Result19 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel8
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy15
  professional?: Professional8
  tipjar_settings: TipjarSettings8
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel8 {}

interface Legacy15 {
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities12
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

interface Entities12 {
  description: Description8
  url: Url26
}

interface Description8 {
  urls: Url25[]
}

interface Url25 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Url26 {
  urls: Url27[]
}

interface Url27 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Professional8 {
  rest_id: string
  professional_type: string
  category: any[]
}

interface TipjarSettings8 {}

interface AdMetadataContainer {
  renderLegacyWebsiteCard: boolean
}

interface ExperimentValue {
  key: string
  value: string
}

interface ClickTrackingInfo {
  urlParams: UrlParam[]
}

interface UrlParam {
  key: string
  value: string
}

interface FeedbackInfo {
  feedbackKeys: string[]
}

interface ClientEventInfo {
  component: string
  element: string
  details: Details
}

interface Details {
  timelinesDetails: TimelinesDetails
}

interface TimelinesDetails {
  injectionType: string
  controllerData: string
}

interface ResponseObjects {
  feedbackActions: FeedbackAction[]
}

interface FeedbackAction {
  key: string
  value: Value3
}

interface Value3 {
  feedbackType: string
  prompt: string
  confirmation: string
  childKeys?: string[]
  feedbackUrl: string
  hasUndoAction: boolean
  icon?: string
  clientEventInfo?: ClientEventInfo2
}

interface ClientEventInfo2 {
  action: string
  element: string
}

interface Metadata {
  scribeConfig: ScribeConfig
}

interface ScribeConfig {
  page: string
}
