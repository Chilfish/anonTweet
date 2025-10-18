/**
 * The raw data received when fetching the members of a tweet list.
 *
 * @public
 */
export interface IListMembersResponse {
  data: Data
}

interface Data {
  list: List
}

interface List {
  members_timeline: MembersTimeline
}

interface MembersTimeline {
  timeline: Timeline
}

interface Timeline {
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
  tipjar_settings: TipjarSettings
  verified_phone_status: boolean
  professional?: Professional
}

interface AffiliatesHighlightedLabel {}

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
  profile_banner_url?: string
  profile_image_url_https: string
  profile_interstitial_type: string
  screen_name: string
  statuses_count: number
  translator_type: string
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: any[]
  url?: string
  verified_type?: string
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
