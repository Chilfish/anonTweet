/**
 * The raw data received when following a given user.
 *
 * @public
 */
export interface IUserFollowResponse {
  id: number
  id_str: string
  name: string
  screen_name: string
  location: string
  description: string
  url: any
  entities: Entities
  protected: boolean
  followers_count: number
  fast_followers_count: number
  normal_followers_count: number
  friends_count: number
  listed_count: number
  created_at: string
  favourites_count: number
  utc_offset: any
  time_zone: any
  geo_enabled: boolean
  verified: boolean
  statuses_count: number
  media_count: number
  lang: any
  status: Status
  contributors_enabled: boolean
  is_translator: boolean
  is_translation_enabled: boolean
  profile_background_color: string
  profile_background_image_url: string
  profile_background_image_url_https: string
  profile_background_tile: boolean
  profile_image_url: string
  profile_image_url_https: string
  profile_banner_url: string
  profile_link_color: string
  profile_sidebar_border_color: string
  profile_sidebar_fill_color: string
  profile_text_color: string
  profile_use_background_image: boolean
  has_extended_profile: boolean
  default_profile: boolean
  default_profile_image: boolean
  pinned_tweet_ids: number[]
  pinned_tweet_ids_str: string[]
  has_custom_timelines: boolean
  can_media_tag: boolean
  followed_by: boolean
  following: boolean
  follow_request_sent: boolean
  notifications: boolean
  muting: boolean
  advertiser_account_type: string
  advertiser_account_service_levels: any[]
  business_profile_state: string
  translator_type: string
  withheld_in_countries: any[]
  require_some_consent: boolean
}

interface Entities {
  description: Description
}

interface Description {
  urls: any[]
}

interface Status {
  created_at: string
  id: number
  id_str: string
  text: string
  truncated: boolean
  entities: Entities2
  extended_entities: ExtendedEntities
  source: string
  in_reply_to_status_id: any
  in_reply_to_status_id_str: any
  in_reply_to_user_id: any
  in_reply_to_user_id_str: any
  in_reply_to_screen_name: any
  geo: any
  coordinates: any
  place: any
  contributors: any
  is_quote_status: boolean
  retweet_count: number
  favorite_count: number
  favorited: boolean
  retweeted: boolean
  possibly_sensitive: boolean
  possibly_sensitive_editable: boolean
  lang: string
  supplemental_language: any
}

interface Entities2 {
  hashtags: any[]
  symbols: any[]
  user_mentions: any[]
  urls: any[]
  media: Medum[]
}

interface Medum {
  id: number
  id_str: string
  indices: number[]
  media_url: string
  media_url_https: string
  url: string
  display_url: string
  expanded_url: string
  type: string
  original_info: OriginalInfo
  sizes: Sizes
  features: Features
}

interface OriginalInfo {
  width: number
  height: number
  focus_rects: FocusRect[]
}

interface FocusRect {
  x: number
  y: number
  h: number
  w: number
}

interface Sizes {
  thumb: Thumb
  medium: Medium
  large: Large
  small: Small
}

interface Thumb {
  w: number
  h: number
  resize: string
}

interface Medium {
  w: number
  h: number
  resize: string
}

interface Large {
  w: number
  h: number
  resize: string
}

interface Small {
  w: number
  h: number
  resize: string
}

interface Features {
  medium: Medium2
  orig: Orig
  large: Large2
  small: Small2
}

interface Medium2 {
  faces: any[]
}

interface Orig {
  faces: any[]
}

interface Large2 {
  faces: any[]
}

interface Small2 {
  faces: any[]
}

interface ExtendedEntities {
  media: Medum2[]
}

interface Medum2 {
  id: number
  id_str: string
  indices: number[]
  media_url: string
  media_url_https: string
  url: string
  display_url: string
  expanded_url: string
  type: string
  original_info: OriginalInfo2
  sizes: Sizes2
  features: Features2
  media_key: string
}

interface OriginalInfo2 {
  width: number
  height: number
  focus_rects: FocusRect2[]
}

interface FocusRect2 {
  x: number
  y: number
  h: number
  w: number
}

interface Sizes2 {
  thumb: Thumb2
  medium: Medium3
  large: Large3
  small: Small3
}

interface Thumb2 {
  w: number
  h: number
  resize: string
}

interface Medium3 {
  w: number
  h: number
  resize: string
}

interface Large3 {
  w: number
  h: number
  resize: string
}

interface Small3 {
  w: number
  h: number
  resize: string
}

interface Features2 {
  medium: Medium4
  orig: Orig2
  large: Large4
  small: Small4
}

interface Medium4 {
  faces: any[]
}

interface Orig2 {
  faces: any[]
}

interface Large4 {
  faces: any[]
}

interface Small4 {
  faces: any[]
}
