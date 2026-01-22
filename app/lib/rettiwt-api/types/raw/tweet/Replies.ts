/**
 * The raw data received when fetching the replies of a given tweet.
 *
 * @public
 */
export interface ITweetRepliesResponse {
  data: Data
}

interface Data {
  threaded_conversation_with_injections_v2: ThreadedConversationWithInjectionsV2
}

interface ThreadedConversationWithInjectionsV2 {
  instructions: Instruction[]
}

interface Instruction {
  type: string
  entries?: Entry[]
  direction?: string
}

interface Entry {
  entryId: string
  sortIndex: string
  content: Content
}

interface Content {
  entryType: string
  __typename: string
  items?: Item[]
  displayType?: string
  clientEventInfo?: ClientEventInfo2
  itemContent?: ItemContent
}

interface Item {
  entryId: string
  item: Item2
}

interface Item2 {
  itemContent: ItemContent
  clientEventInfo: ClientEventInfo
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
  rest_id: string
  has_birdwatch_notes: boolean
  core: Core
  unmention_data: UnmentionData
  edit_control: EditControl
  is_translatable: boolean
  views: Views
  source: string
  legacy: Legacy2
  quick_promote_eligibility: QuickPromoteEligibility
  unified_card?: UnifiedCard
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
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel {}

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
  want_retweets: boolean
  withheld_in_countries: any[]
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
  extended_entities?: ExtendedEntities
  possibly_sensitive?: boolean
  possibly_sensitive_editable?: boolean
}

interface Entities2 {
  hashtags: any[]
  symbols: any[]
  timestamps: any[]
  urls: Url4[]
  user_mentions: UserMention[]
  media?: Medum[]
}

interface Url4 {
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

interface Medum {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_key: string
  media_url_https: string
  type: string
  url: string
  additional_media_info?: AdditionalMediaInfo
  ext_media_availability: ExtMediaAvailability
  sizes: Sizes
  original_info: OriginalInfo
  video_info: VideoInfo
  ext_alt_text?: string
}

interface AdditionalMediaInfo {
  monetizable: boolean
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
  additional_media_info?: AdditionalMediaInfo2
  ext_media_availability: ExtMediaAvailability2
  sizes: Sizes2
  original_info: OriginalInfo2
  video_info: VideoInfo2
  ext_alt_text?: string
}

interface AdditionalMediaInfo2 {
  monetizable: boolean
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

interface QuickPromoteEligibility {
  eligibility: string
}

interface UnifiedCard {
  card_fetch_state: string
}

interface PromotedMetadata {
  advertiser_results: AdvertiserResults
  disclosureType: string
  experimentValues: any[]
  impressionId: string
  impressionString: string
  clickTrackingInfo: ClickTrackingInfo
}

interface AdvertiserResults {
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
  professional: Professional2
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
  url: Url6
}

interface Description2 {
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

interface Professional2 {
  rest_id: string
  professional_type: string
  category: Category2[]
}

interface Category2 {
  id: number
  name: string
  icon_name: string
}

interface ClickTrackingInfo {
  urlParams: UrlParam[]
}

interface UrlParam {
  key: string
  value: string
}

interface ClientEventInfo {
  details: Details
}

interface Details {
  conversationDetails: ConversationDetails
  timelinesDetails?: TimelinesDetails
}

interface ConversationDetails {
  conversationSection: string
}

interface TimelinesDetails {
  controllerData: string
}

interface ClientEventInfo2 {
  details: Details2
}

interface Details2 {
  conversationDetails: ConversationDetails2
}

interface ConversationDetails2 {
  conversationSection: string
}

interface ItemContent2 {
  itemType: string
  __typename: string
  value: string
  cursorType: string
}
