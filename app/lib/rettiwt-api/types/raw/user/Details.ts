/**
 * The raw data received when fetching the details of the given user.
 *
 * @public
 */
export interface IUserDetailsResponse {
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
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel
  has_nft_avatar: boolean
  legacy: Legacy
  smart_blocked_by: boolean
  smart_blocking: boolean
  super_follow_eligible: boolean
  super_followed_by: boolean
  super_following: boolean
  legacy_extended_profile: LegacyExtendedProfile
  is_profile_translatable: boolean
}

interface AffiliatesHighlightedLabel {
  label: AffiliatesHighlightedLabelDetails
}

interface AffiliatesHighlightedLabelDetails {
  badge: AffiliatesHighlightedLabelBadge
  description: string
  longDescription: AffiliatesHighlightedLabelDescription
}

interface AffiliatesHighlightedLabelBadge {
  url: string
}

interface AffiliatesHighlightedLabelDescription {
  text: string
  entities: AffiliatesHighlightedLabelEntity[]
}

interface AffiliatesHighlightedLabelEntity {
  fromIndex: number
  toIndex: number
  ref: AffiliatesHighlightedMention
}

interface AffiliatesHighlightedMention {
  type: string
  screen_name: string
  mention_results: AffiliatesHighlightedMentionResults
}

interface AffiliatesHighlightedMentionResults {
  result: AffiliatesHighlightedMentionResult
}

interface AffiliatesHighlightedMentionResult {
  __typename: string
  legacy: AffiliatesHighlightedMentionResultLegacy
  rest_id: string
}

interface AffiliatesHighlightedMentionResultLegacy {
  screen_name: string
}

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
  pinned_tweet_ids_str: any[]
  possibly_sensitive: boolean
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
}

interface Entities {
  description: Description
}

interface Description {
  urls: any[]
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

interface LegacyExtendedProfile {}
