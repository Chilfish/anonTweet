/**
 * The raw data received when fetching the analytic overview of the user.
 *
 * @public
 */
export interface IUserAffiliatesResponse {
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
  clientEventInfo?: ClientEventInfo
  value?: string
  cursorType?: string
}

interface ItemContent {
  itemType: string
  __typename: string
  user_results: UserResults
  userDisplayType: string
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
  parody_commentary_fan_label: string
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy
  tipjar_settings: TipjarSettings
  verified_phone_status: boolean
  professional?: Professional
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
  profile_image_url_https: string
  profile_interstitial_type: string
  screen_name: string
  statuses_count: number
  translator_type: string
  url?: string
  verified: boolean
  verified_type: string
  want_retweets: boolean
  withheld_in_countries: any[]
  profile_banner_url?: string
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

interface ClientEventInfo {
  component: string
  element: string
}
