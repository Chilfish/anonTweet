/**
 * The raw data received when fetching the tweets in a tweet list.
 *
 * @public
 */
export interface IListTweetsResponse {
  data: Data
}

interface Data {
  list: List
}

interface List {
  tweets_timeline: TweetsTimeline
}

interface TweetsTimeline {
  timeline: Timeline
}

interface Timeline {
  instructions: Instruction[]
  metadata: Metadata2
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
}

interface TweetResults {
  result: Result
}

interface Result {
  __typename: string
  rest_id: string
  core: Core
  edit_control: EditControl
  edit_perspective: EditPerspective
  is_translatable: boolean
  views: Views
  source: string
  legacy: Legacy2
  quoted_status_result?: QuotedStatusResult
  previous_counts?: PreviousCounts
  card?: Card
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
  url: string
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: any[]
  following?: boolean
  verified_type?: string
}

interface Entities {
  description: Description
  url: Url
}

interface Description {
  urls: any[]
}

interface Url {
  urls: Url2[]
}

interface Url2 {
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

interface EditPerspective {
  favorited: boolean
  retweeted: boolean
}

interface Views {
  state: string
  count?: string
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
  place?: Place
  quoted_status_id_str?: string
  quoted_status_permalink?: QuotedStatusPermalink
}

interface Entities2 {
  media?: Medum[]
  user_mentions: UserMention[]
  urls: Url3[]
  hashtags: Hashtag[]
  symbols: any[]
}

interface Medum {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_url_https: string
  source_status_id_str?: string
  source_user_id_str?: string
  type: string
  url: string
  features: Features
  sizes: Sizes
  original_info: OriginalInfo
}

interface Features {
  large?: Large
  medium?: Medium
  small?: Small
  orig?: Orig
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
  focus_rects?: FocusRect[]
}

interface FocusRect {
  x: number
  y: number
  w: number
  h: number
}

interface UserMention {
  id_str: string
  name: string
  screen_name: string
  indices: number[]
}

interface Url3 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Hashtag {
  indices: number[]
  text: string
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
  source_status_id_str?: string
  source_user_id_str?: string
  type: string
  url: string
  ext_media_availability: ExtMediaAvailability
  features: Features2
  sizes: Sizes2
  original_info: OriginalInfo2
  ext_alt_text?: string
  additional_media_info?: AdditionalMediaInfo
  mediaStats?: MediaStats
  video_info?: VideoInfo
}

interface ExtMediaAvailability {
  status: string
}

interface Features2 {
  large?: Large3
  medium?: Medium3
  small?: Small3
  orig?: Orig2
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
  focus_rects?: FocusRect2[]
}

interface FocusRect2 {
  x: number
  y: number
  w: number
  h: number
}

interface AdditionalMediaInfo {
  monetizable: boolean
  source_user?: SourceUser
  title?: string
  description?: string
  embeddable?: boolean
  call_to_actions?: CallToActions
}

interface SourceUser {
  user_results: UserResults2
}

interface UserResults2 {
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
  professional?: Professional2
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
  following?: boolean
  verified_type?: string
}

interface Entities3 {
  description: Description2
  url: Url4
}

interface Description2 {
  urls: any[]
}

interface Url4 {
  urls: Url5[]
}

interface Url5 {
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

interface CallToActions {
  visit_site: VisitSite
}

interface VisitSite {
  url: string
}

interface MediaStats {
  viewCount: number
}

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

interface RetweetedStatusResult {
  result: Result4
}

interface Result4 {
  __typename: string
  rest_id: string
  core: Core2
  edit_control: EditControl2
  edit_perspective: EditPerspective2
  is_translatable: boolean
  views: Views2
  source: string
  legacy: Legacy5
}

interface Core2 {
  user_results: UserResults3
}

interface UserResults3 {
  result: Result5
}

interface Result5 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel3
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy4
  verified_phone_status: boolean
  professional?: Professional3
}

interface AffiliatesHighlightedLabel3 {
  label?: Label
}

interface Label {
  url: Url6
  badge: Badge
  description: string
  userLabelType: string
  userLabelDisplayType: string
}

interface Url6 {
  url: string
  urlType: string
}

interface Badge {
  url: string
}

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
  verified_type?: string
}

interface Entities4 {
  description: Description3
  url: Url7
}

interface Description3 {
  urls: any[]
}

interface Url7 {
  urls: Url8[]
}

interface Url8 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Professional3 {
  rest_id: string
  professional_type: string
  category: Category3[]
}

interface Category3 {
  id: number
  name: string
  icon_name: string
}

interface EditControl2 {
  edit_tweet_ids: string[]
  editable_until_msecs: string
  is_edit_eligible: boolean
  edits_remaining: string
}

interface EditPerspective2 {
  favorited: boolean
  retweeted: boolean
}

interface Views2 {
  count: string
  state: string
}

interface Legacy5 {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities5
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

interface Entities5 {
  media: Medum3[]
  user_mentions: UserMention2[]
  urls: Url9[]
  hashtags: Hashtag2[]
  symbols: any[]
}

interface Medum3 {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_url_https: string
  type: string
  url: string
  features: Features3
  sizes: Sizes3
  original_info: OriginalInfo3
}

interface Features3 {
  large?: Large5
  medium?: Medium5
  small?: Small5
  orig?: Orig3
  all?: All3
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

interface All3 {
  tags: Tag3[]
}

interface Tag3 {
  user_id: string
  name: string
  screen_name: string
  type: string
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
  focus_rects?: FocusRect3[]
}

interface FocusRect3 {
  x: number
  y: number
  w: number
  h: number
}

interface UserMention2 {
  id_str: string
  name: string
  screen_name: string
  indices: number[]
}

interface Url9 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface Hashtag2 {
  indices: number[]
  text: string
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
  ext_media_availability: ExtMediaAvailability2
  features: Features4
  sizes: Sizes4
  original_info: OriginalInfo4
  additional_media_info?: AdditionalMediaInfo2
  mediaStats?: MediaStats2
  video_info?: VideoInfo2
}

interface ExtMediaAvailability2 {
  status: string
}

interface Features4 {
  large?: Large7
  medium?: Medium7
  small?: Small7
  orig?: Orig4
  all?: All4
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

interface All4 {
  tags: Tag4[]
}

interface Tag4 {
  user_id: string
  name: string
  screen_name: string
  type: string
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
  focus_rects?: FocusRect4[]
}

interface FocusRect4 {
  x: number
  y: number
  w: number
  h: number
}

interface AdditionalMediaInfo2 {
  monetizable: boolean
}

interface MediaStats2 {
  viewCount: number
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

interface Place {
  attributes: Attributes
  bounding_box: BoundingBox
  contained_within: any[]
  country: string
  country_code: string
  full_name: string
  name: string
  id: string
  place_type: string
  url: string
}

interface Attributes {}

interface BoundingBox {
  coordinates: number[][][]
  type: string
}

interface QuotedStatusPermalink {
  url: string
  expanded: string
  display: string
}

interface QuotedStatusResult {
  result: Result6
}

interface Result6 {
  __typename: string
  rest_id: string
  core: Core3
  edit_control: EditControl3
  edit_perspective: EditPerspective3
  is_translatable: boolean
  views: Views3
  source: string
  legacy: Legacy7
}

interface Core3 {
  user_results: UserResults4
}

interface UserResults4 {
  result: Result7
}

interface Result7 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel4
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy6
  professional?: Professional4
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

interface Legacy6 {
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities6
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

interface Entities6 {
  description: Description4
  url?: Url11
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
  category: Category4[]
}

interface Category4 {
  id: number
  name: string
  icon_name: string
}

interface EditControl3 {
  edit_tweet_ids: string[]
  editable_until_msecs: string
  is_edit_eligible: boolean
  edits_remaining: string
}

interface EditPerspective3 {
  favorited: boolean
  retweeted: boolean
}

interface Views3 {
  count: string
  state: string
}

interface Legacy7 {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities7
  extended_entities?: ExtendedEntities3
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

interface Entities7 {
  media?: Medum5[]
  user_mentions: UserMention3[]
  urls: any[]
  hashtags: any[]
  symbols: any[]
}

interface Medum5 {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_url_https: string
  type: string
  url: string
  features: Features5
  sizes: Sizes5
  original_info: OriginalInfo5
}

interface Features5 {
  all?: All5
  large: Large9
  medium: Medium9
  small: Small9
  orig: Orig5
}

interface All5 {
  tags: Tag5[]
}

interface Tag5 {
  user_id: string
  name: string
  screen_name: string
  type: string
}

interface Large9 {
  faces: any[]
}

interface Medium9 {
  faces: any[]
}

interface Small9 {
  faces: any[]
}

interface Orig5 {
  faces: any[]
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

interface UserMention3 {
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
  ext_media_availability: ExtMediaAvailability3
  features: Features6
  sizes: Sizes6
  original_info: OriginalInfo6
}

interface ExtMediaAvailability3 {
  status: string
}

interface Features6 {
  all?: All6
  large: Large11
  medium: Medium11
  small: Small11
  orig: Orig6
}

interface All6 {
  tags: Tag6[]
}

interface Tag6 {
  user_id: string
  name: string
  screen_name: string
  type: string
}

interface Large11 {
  faces: any[]
}

interface Medium11 {
  faces: any[]
}

interface Small11 {
  faces: any[]
}

interface Orig6 {
  faces: any[]
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

interface PreviousCounts {
  bookmark_count: number
  favorite_count: number
  quote_count: number
  reply_count: number
  retweet_count: number
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
  result: Result8
}

interface Result8 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel5
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy9
  professional?: Professional5
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
  following?: boolean
  verified_type?: string
}

interface Entities8 {
  description: Description5
  url: Url13
}

interface Description5 {
  urls: any[]
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

interface Professional5 {
  rest_id: string
  professional_type: string
  category: Category5[]
}

interface Category5 {
  id: number
  name: string
  icon_name: string
}

interface UnifiedCard {
  card_fetch_state: string
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
}

interface Item {
  entryId: string
  item: Item2
}

interface Item2 {
  itemContent: ItemContent2
  clientEventInfo: ClientEventInfo2
}

interface ItemContent2 {
  itemType: string
  __typename: string
  tweet_results: TweetResults2
  tweetDisplayType: string
}

interface TweetResults2 {
  result: Result9
}

interface Result9 {
  __typename: string
  rest_id: string
  core: Core4
  edit_control: EditControl4
  edit_perspective: EditPerspective4
  is_translatable: boolean
  views: Views4
  source: string
  legacy: Legacy11
  card?: Card2
  unified_card?: UnifiedCard2
}

interface Core4 {
  user_results: UserResults5
}

interface UserResults5 {
  result: Result10
}

interface Result10 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel6
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy10
  professional?: Professional6
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel6 {}

interface Legacy10 {
  following?: boolean
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities9
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

interface Entities9 {
  description: Description6
  url: Url15
}

interface Description6 {
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

interface Professional6 {
  rest_id: string
  professional_type: string
  category: Category6[]
}

interface Category6 {
  id: number
  name: string
  icon_name: string
}

interface EditControl4 {
  edit_tweet_ids: string[]
  editable_until_msecs: string
  is_edit_eligible: boolean
  edits_remaining: string
}

interface EditPerspective4 {
  favorited: boolean
  retweeted: boolean
}

interface Views4 {
  count: string
  state: string
}

interface Legacy11 {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities10
  extended_entities?: ExtendedEntities4
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

interface Entities10 {
  media?: Medum7[]
  user_mentions: UserMention4[]
  urls: Url17[]
  hashtags: any[]
  symbols: any[]
}

interface Medum7 {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_url_https: string
  type: string
  url: string
  features: Features7
  sizes: Sizes7
  original_info: OriginalInfo7
}

interface Features7 {
  all: All7
  large: Large13
  medium: Medium13
  small: Small13
  orig: Orig7
}

interface All7 {
  tags: Tag7[]
}

interface Tag7 {
  user_id: string
  name: string
  screen_name: string
  type: string
}

interface Large13 {
  faces: Face17[]
}

interface Face17 {
  x: number
  y: number
  h: number
  w: number
}

interface Medium13 {
  faces: Face18[]
}

interface Face18 {
  x: number
  y: number
  h: number
  w: number
}

interface Small13 {
  faces: Face19[]
}

interface Face19 {
  x: number
  y: number
  h: number
  w: number
}

interface Orig7 {
  faces: Face20[]
}

interface Face20 {
  x: number
  y: number
  h: number
  w: number
}

interface Sizes7 {
  large: Large14
  medium: Medium14
  small: Small14
  thumb: Thumb7
}

interface Large14 {
  h: number
  w: number
  resize: string
}

interface Medium14 {
  h: number
  w: number
  resize: string
}

interface Small14 {
  h: number
  w: number
  resize: string
}

interface Thumb7 {
  h: number
  w: number
  resize: string
}

interface OriginalInfo7 {
  height: number
  width: number
  focus_rects: FocusRect7[]
}

interface FocusRect7 {
  x: number
  y: number
  w: number
  h: number
}

interface UserMention4 {
  id_str: string
  name: string
  screen_name: string
  indices: number[]
}

interface Url17 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface ExtendedEntities4 {
  media: Medum8[]
}

interface Medum8 {
  display_url: string
  expanded_url: string
  id_str: string
  indices: number[]
  media_key: string
  media_url_https: string
  type: string
  url: string
  ext_media_availability: ExtMediaAvailability4
  features: Features8
  sizes: Sizes8
  original_info: OriginalInfo8
}

interface ExtMediaAvailability4 {
  status: string
}

interface Features8 {
  all: All8
  large: Large15
  medium: Medium15
  small: Small15
  orig: Orig8
}

interface All8 {
  tags: Tag8[]
}

interface Tag8 {
  user_id: string
  name: string
  screen_name: string
  type: string
}

interface Large15 {
  faces: Face21[]
}

interface Face21 {
  x: number
  y: number
  h: number
  w: number
}

interface Medium15 {
  faces: Face22[]
}

interface Face22 {
  x: number
  y: number
  h: number
  w: number
}

interface Small15 {
  faces: Face23[]
}

interface Face23 {
  x: number
  y: number
  h: number
  w: number
}

interface Orig8 {
  faces: Face24[]
}

interface Face24 {
  x: number
  y: number
  h: number
  w: number
}

interface Sizes8 {
  large: Large16
  medium: Medium16
  small: Small16
  thumb: Thumb8
}

interface Large16 {
  h: number
  w: number
  resize: string
}

interface Medium16 {
  h: number
  w: number
  resize: string
}

interface Small16 {
  h: number
  w: number
  resize: string
}

interface Thumb8 {
  h: number
  w: number
  resize: string
}

interface OriginalInfo8 {
  height: number
  width: number
  focus_rects: FocusRect8[]
}

interface FocusRect8 {
  x: number
  y: number
  w: number
  h: number
}

interface Card2 {
  rest_id: string
  legacy: Legacy12
}

interface Legacy12 {
  binding_values: BindingValue2[]
  card_platform: CardPlatform2
  name: string
  url: string
  user_refs_results: UserRefsResult2[]
}

interface BindingValue2 {
  key: string
  value: Value2
}

interface Value2 {
  string_value?: string
  type: string
  image_value?: ImageValue2
  scribe_key?: string
  user_value?: UserValue2
  image_color_value?: ImageColorValue2
}

interface ImageValue2 {
  height: number
  width: number
  url: string
}

interface UserValue2 {
  id_str: string
  path: any[]
}

interface ImageColorValue2 {
  palette: Palette2[]
}

interface Palette2 {
  rgb: Rgb2
  percentage: number
}

interface Rgb2 {
  blue: number
  green: number
  red: number
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

interface UserRefsResult2 {
  result: Result11
}

interface Result11 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel7
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy13
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel7 {}

interface Legacy13 {
  following: boolean
  can_dm: boolean
  can_media_tag: boolean
  created_at: string
  default_profile: boolean
  default_profile_image: boolean
  description: string
  entities: Entities11
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

interface Entities11 {
  description: Description7
  url: Url18
}

interface Description7 {
  urls: any[]
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

interface UnifiedCard2 {
  card_fetch_state: string
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
}

interface Metadata {
  conversationMetadata: ConversationMetadata
}

interface ConversationMetadata {
  allTweetIds: string[]
  enableDeduplication: boolean
}

interface Metadata2 {
  scribeConfig: ScribeConfig
}

interface ScribeConfig {
  page: string
}
