/**
 * The raw data received when fetching the followed timeline of the given user.
 *
 * @public
 */
export interface IUserFollowedResponse {
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
  metadata: Metadata2
}

interface Instruction {
  type: string
  entries?: Entry[]
  alertType?: string
  triggerDelayMs?: number
  displayDurationMs?: number
  usersResults?: UsersResult[]
  richText?: RichText
  iconDisplayInfo?: IconDisplayInfo
  colorConfig?: ColorConfig
  displayLocation?: string
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
  items?: Item[]
  metadata?: Metadata
  displayType?: string
  value?: string
  cursorType?: string
}

interface ItemContent {
  itemType: string
  __typename: string
  tweet_results: TweetResults
  tweetDisplayType: string
  promotedMetadata?: PromotedMetadata
  socialContext?: SocialContext
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
  note_tweet?: NoteTweet
  tweet?: Tweet
  limitedActionResults?: LimitedActionResults
  card?: Card2
  previous_counts?: PreviousCounts
  quoted_status_result?: QuotedStatusResult
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
  professional?: Professional
  tipjar_settings: TipjarSettings
  verified_phone_status: boolean
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
  following?: boolean
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

interface TipjarSettings {}

interface UnmentionData {}

interface EditControl {
  edit_tweet_ids?: string[]
  editable_until_msecs?: string
  is_edit_eligible?: boolean
  edits_remaining?: string
  initial_tweet_id?: string
  edit_control_initial?: EditControlInitial
}

interface EditControlInitial {
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
  scopes?: Scopes
  quoted_status_id_str?: string
  quoted_status_permalink?: QuotedStatusPermalink
}

interface Entities2 {
  hashtags: Hashtag[]
  media?: Medum[]
  symbols: any[]
  timestamps: any[]
  urls: Url5[]
  user_mentions: UserMention[]
}

interface Hashtag {
  indices: number[]
  text: string
}

interface Medum {
  display_url: string
  expanded_url: string
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
  allow_download_status?: AllowDownloadStatus
  ext_alt_text?: string
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
}

interface VideoInfo {
  aspect_ratio: number[]
  duration_millis?: number
  variants: Variant[]
}

interface Variant {
  bitrate?: number
  content_type: string
  url: string
}

interface AllowDownloadStatus {
  allow_download: boolean
}

interface Url5 {
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
  allow_download_status?: AllowDownloadStatus2
  ext_alt_text?: string
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
  result: Result4
}

interface Result4 {
  media_key: string
}

interface AdditionalMediaInfo2 {
  monetizable: boolean
}

interface VideoInfo2 {
  aspect_ratio: number[]
  duration_millis?: number
  variants: Variant2[]
}

interface Variant2 {
  bitrate?: number
  content_type: string
  url: string
}

interface AllowDownloadStatus2 {
  allow_download: boolean
}

interface Scopes {
  followers: boolean
}

interface QuotedStatusPermalink {
  url: string
  expanded: string
  display: string
}

interface NoteTweet {
  is_expandable: boolean
  note_tweet_results: NoteTweetResults
}

interface NoteTweetResults {
  result: Result5
}

interface Result5 {
  id: string
  text: string
  entity_set: EntitySet
  richtext?: Richtext
  media?: Media
}

interface EntitySet {
  hashtags: Hashtag2[]
  symbols: any[]
  urls: Url6[]
  user_mentions: UserMention2[]
  timestamps?: any[]
}

interface Hashtag2 {
  indices: number[]
  text: string
}

interface Url6 {
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

interface Richtext {
  richtext_tags: RichtextTag[]
}

interface RichtextTag {
  from_index: number
  to_index: number
  richtext_types: string[]
}

interface Media {
  inline_media: InlineMedum[]
}

interface InlineMedum {
  media_id: string
  index: number
}

interface Tweet {
  rest_id: string
  core: Core2
  card: Card
  unmention_data: UnmentionData2
  edit_control: EditControl2
  is_translatable: boolean
  views: Views2
  source: string
  legacy: Legacy5
}

interface Core2 {
  user_results: UserResults2
}

interface UserResults2 {
  result: Result6
}

interface Result6 {
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
  url: Url8
}

interface Description2 {
  urls: Url7[]
}

interface Url7 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
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

interface Professional2 {
  rest_id: string
  professional_type: string
  category: any[]
}

interface TipjarSettings2 {}

interface Card {
  rest_id: string
  legacy: Legacy4
}

interface Legacy4 {
  binding_values: BindingValue[]
  card_platform: CardPlatform
  name: string
  url: string
  user_refs_results: any[]
}

interface BindingValue {
  key: string
  value: Value
}

interface Value {
  string_value: string
  type: string
  scribe_key?: string
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

interface Legacy5 {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_control: ConversationControl
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities4
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
  result: Result7
}

interface Result7 {
  __typename: string
  legacy: Legacy6
}

interface Legacy6 {
  screen_name: string
}

interface Entities4 {
  hashtags: any[]
  symbols: any[]
  timestamps: any[]
  urls: Url10[]
  user_mentions: any[]
}

interface Url10 {
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

interface Card2 {
  rest_id: string
  legacy: Legacy7
}

interface Legacy7 {
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

interface PreviousCounts {
  bookmark_count: number
  favorite_count: number
  quote_count: number
  reply_count: number
  retweet_count: number
}

interface QuotedStatusResult {
  result: Result8
}

interface Result8 {
  __typename: string
  rest_id: string
  core: Core3
  unmention_data: UnmentionData3
  edit_control: EditControl3
  is_translatable: boolean
  views: Views3
  source: string
  note_tweet: NoteTweet2
  legacy: Legacy9
}

interface Core3 {
  user_results: UserResults3
}

interface UserResults3 {
  result: Result9
}

interface Result9 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel3
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy8
  tipjar_settings: TipjarSettings3
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel3 {
  label: Label2
}

interface Label2 {
  url: Url11
  badge: Badge2
  description: string
  userLabelType: string
  userLabelDisplayType: string
}

interface Url11 {
  url: string
  urlType: string
}

interface Badge2 {
  url: string
}

interface Legacy8 {
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
  verified: boolean
  verified_type: string
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities5 {
  description: Description3
}

interface Description3 {
  urls: any[]
}

interface TipjarSettings3 {}

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

interface NoteTweet2 {
  is_expandable: boolean
  note_tweet_results: NoteTweetResults2
}

interface NoteTweetResults2 {
  result: Result10
}

interface Result10 {
  id: string
  text: string
  entity_set: EntitySet2
}

interface EntitySet2 {
  hashtags: any[]
  symbols: any[]
  urls: any[]
  user_mentions: any[]
}

interface Legacy9 {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities6
  favorite_count: number
  favorited: boolean
  full_text: string
  is_quote_status: boolean
  lang: string
  quote_count: number
  reply_count: number
  retweet_count: number
  retweeted: boolean
  user_id_str: string
  id_str: string
}

interface Entities6 {
  hashtags: any[]
  symbols: any[]
  timestamps: any[]
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
  result: Result11
}

interface Result11 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel4
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy10
  tipjar_settings: TipjarSettings4
  verified_phone_status: boolean
  professional?: Professional3
}

interface AffiliatesHighlightedLabel4 {}

interface Legacy10 {
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
  want_retweets: boolean
  withheld_in_countries: any[]
  verified_type?: string
}

interface Entities7 {
  description: Description4
  url: Url13
}

interface Description4 {
  urls: Url12[]
}

interface Url12 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Url13 {
  urls: Url14[]
}

interface Url14 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface TipjarSettings4 {}

interface Professional3 {
  rest_id: string
  professional_type: string
  category: Category2[]
}

interface Category2 {
  id: number
  name: string
  icon_name: string
}

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

interface SocialContext {
  type: string
  contextType: string
  text: string
  landingUrl: LandingUrl
}

interface LandingUrl {
  url: string
  urlType: string
}

interface FeedbackInfo {
  feedbackKeys: string[]
}

interface ClientEventInfo {
  component: string
  element?: string
  details: Details
}

interface Details {
  timelinesDetails: TimelinesDetails
}

interface TimelinesDetails {
  injectionType: string
  controllerData: string
}

interface Item {
  entryId: string
  item: Item2
}

interface Item2 {
  itemContent: ItemContent2
  feedbackInfo: FeedbackInfo2
  clientEventInfo: ClientEventInfo2
}

interface ItemContent2 {
  itemType: string
  __typename: string
  tweet_results: TweetResults2
  tweetDisplayType: string
}

interface TweetResults2 {
  result: Result12
}

interface Result12 {
  __typename: string
  rest_id: string
  core: Core4
  unmention_data: UnmentionData4
  edit_control: EditControl4
  is_translatable: boolean
  views: Views4
  source: string
  legacy: Legacy12
}

interface Core4 {
  user_results: UserResults4
}

interface UserResults4 {
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
  legacy: Legacy11
  professional?: Professional4
  tipjar_settings: TipjarSettings5
  super_follow_eligible?: boolean
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel5 {}

interface Legacy11 {
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
  url?: string
  verified: boolean
  verified_type?: string
  want_retweets: boolean
  withheld_in_countries: any[]
  following?: boolean
}

interface Entities8 {
  description: Description5
  url?: Url15
}

interface Description5 {
  urls: any[]
}

interface Url15 {
  urls: Url16[]
}

interface Url16 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Professional4 {
  rest_id: string
  professional_type: string
  category: Category3[]
}

interface Category3 {
  id: number
  name: string
  icon_name: string
}

interface TipjarSettings5 {
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

interface Legacy12 {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities9
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
  in_reply_to_screen_name?: string
  in_reply_to_status_id_str?: string
  in_reply_to_user_id_str?: string
}

interface Entities9 {
  hashtags: any[]
  media?: Medum3[]
  symbols: any[]
  timestamps: any[]
  urls: any[]
  user_mentions: UserMention3[]
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
  ext_media_availability: ExtMediaAvailability3
  features: Features3
  sizes: Sizes3
  original_info: OriginalInfo3
  allow_download_status: AllowDownloadStatus3
  media_results: MediaResults3
  ext_alt_text?: string
}

interface ExtMediaAvailability3 {
  status: string
}

interface Features3 {
  all: All3
  large: Large5
  medium: Medium5
  small: Small5
  orig: Orig3
}

interface All3 {
  tags: Tag3[]
}

interface Tag3 {
  user_id: string
  name: string
  screen_name: string
  type: string
}

interface Large5 {
  faces: Face9[]
}

interface Face9 {
  x: number
  y: number
  h: number
  w: number
}

interface Medium5 {
  faces: Face10[]
}

interface Face10 {
  x: number
  y: number
  h: number
  w: number
}

interface Small5 {
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

interface Sizes3 {
  large: Large6
  medium: Medium6
  small: Small6
  thumb: Thumb3
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

interface MediaResults3 {
  result: Result14
}

interface Result14 {
  media_key: string
}

interface UserMention3 {
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
  ext_media_availability: ExtMediaAvailability4
  features: Features4
  sizes: Sizes4
  original_info: OriginalInfo4
  allow_download_status: AllowDownloadStatus4
  media_results: MediaResults4
  ext_alt_text?: string
}

interface ExtMediaAvailability4 {
  status: string
}

interface Features4 {
  all: All4
  large: Large7
  medium: Medium7
  small: Small7
  orig: Orig4
}

interface All4 {
  tags: Tag4[]
}

interface Tag4 {
  user_id: string
  name: string
  screen_name: string
  type: string
}

interface Large7 {
  faces: Face13[]
}

interface Face13 {
  x: number
  y: number
  h: number
  w: number
}

interface Medium7 {
  faces: Face14[]
}

interface Face14 {
  x: number
  y: number
  h: number
  w: number
}

interface Small7 {
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

interface Sizes4 {
  large: Large8
  medium: Medium8
  small: Small8
  thumb: Thumb4
}

interface Large8 {
  h: number
  w: number
  resize: string
}

interface Medium8 {
  h: number
  w: number
  resize: string
}

interface Small8 {
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

interface MediaResults4 {
  result: Result15
}

interface Result15 {
  media_key: string
}

interface FeedbackInfo2 {
  feedbackKeys: string[]
}

interface ClientEventInfo2 {
  component: string
  element: string
  details: Details2
}

interface Details2 {
  timelinesDetails: TimelinesDetails2
}

interface TimelinesDetails2 {
  injectionType: string
  controllerData: string
}

interface Metadata {
  conversationMetadata: ConversationMetadata
}

interface ConversationMetadata {
  allTweetIds: string[]
  enableDeduplication: boolean
}

interface UsersResult {
  result: Result16
}

interface Result16 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel6
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy13
  professional?: Professional5
  tipjar_settings: TipjarSettings6
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel6 {}

interface Legacy13 {
  following?: boolean
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
  verified_type?: string
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities10 {
  description: Description6
  url: Url18
}

interface Description6 {
  urls: Url17[]
}

interface Url17 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Url18 {
  urls: Url19[]
}

interface Url19 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Professional5 {
  rest_id: string
  professional_type: string
  category: Category4[]
}

interface Category4 {
  id: number
  name: string
  icon_name: string
}

interface TipjarSettings6 {}

interface RichText {
  text: string
  entities: any[]
}

interface IconDisplayInfo {
  icon: string
  tint: string
}

interface ColorConfig {
  background: string
  border: string
  text: string
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
  feedbackUrl: string
  hasUndoAction: boolean
  childKeys?: string[]
  icon?: string
  clientEventInfo?: ClientEventInfo3
}

interface ClientEventInfo3 {
  action: string
  element: string
}

interface Metadata2 {
  scribeConfig: ScribeConfig
}

interface ScribeConfig {
  page: string
}
