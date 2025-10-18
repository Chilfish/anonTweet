/**
 * The raw data received when fetching the followers of the given user.
 *
 * @public
 */
export interface IUserFollowersResponse {
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
  direction?: string
  entries?: Entry[]
}

interface Entry {
  entryId: string
  sortIndex: string
  content: Content
}

interface Content {
  entryType: string
  itemContent?: ItemContent
  clientEventInfo?: ClientEventInfo
  value?: string
  cursorType?: string
}

interface ItemContent {
  itemType: string
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
  has_nft_avatar: boolean
  legacy: Legacy
  super_follow_eligible: boolean
  super_followed_by: boolean
  super_following: boolean
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
  profile_banner_extensions?: ProfileBannerExtensions
  profile_banner_url?: string
  profile_image_extensions?: ProfileImageExtensions
  profile_image_url_https: string
  profile_interstitial_type: string
  protected: boolean
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

interface ClientEventInfo {
  component: string
  element: string
}
