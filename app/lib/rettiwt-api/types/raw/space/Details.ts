/**
 * The raw data received when fetching the details of a given space.
 *
 * @public
 */
export interface ISpaceDetailsResponse {
  rest_id: string
  state: string
  title: string
  media_key: string
  created_at: number
  started_at: number
  ended_at: string
  replay_start_time: number
  updated_at: number
  creator_results: CreatorResults
  conversation_controls: number
  disallow_join: boolean
  is_employee_only: boolean
  is_locked: boolean
  is_muted: boolean
  is_space_available_for_clipping: boolean
  is_space_available_for_replay: boolean
  narrow_cast_space_type: number
  no_incognito: boolean
  total_replay_watched: number
  total_live_listeners: number
  tweet_results: TweetResults
}

interface CreatorResults {
  result: Result
}

interface Result {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy
  professional: Professional
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
  url: string
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities {
  description: Description
  url: Url2
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

interface TweetResults {
  result: Result2
}

interface Result2 {
  __typename: string
  rest_id: string
  core: Core
  card: Card
  voiceInfo: VoiceInfo
  unmention_data: UnmentionData
  unified_card: UnifiedCard
  edit_control: EditControl
  is_translatable: boolean
  views: Views
  source: string
  legacy: Legacy4
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
  affiliates_highlighted_label: AffiliatesHighlightedLabel2
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy2
  professional: Professional2
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel2 {
  label: Label2
}

interface Label2 {
  url: Url4
  badge: Badge2
  description: string
  userLabelType: string
  userLabelDisplayType: string
}

interface Url4 {
  url: string
  urlType: string
}

interface Badge2 {
  url: string
}

interface Legacy2 {
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities2
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

interface Entities2 {
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
  category: Category2[]
}

interface Category2 {
  id: number
  name: string
  icon_name: string
}

interface Card {
  rest_id: string
  legacy: Legacy3
}

interface Legacy3 {
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

interface VoiceInfo {}

interface UnmentionData {}

interface UnifiedCard {
  card_fetch_state: string
}

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

interface Legacy4 {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities3
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

interface Entities3 {
  hashtags: any[]
  symbols: any[]
  timestamps: any[]
  urls: Url7[]
  user_mentions: any[]
}

interface Url7 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}
