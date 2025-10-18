/**
 * The raw data received when fetching the uploaded media of the given user.
 *
 * @public
 */
export interface IUserMediaResponse {
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
  timeline_v2: TimelineV2
}

interface TimelineV2 {
  timeline: Timeline
}

interface Timeline {
  instructions: Instruction[]
  metadata: Metadata
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
  __typename: string
  items?: Item[]
  displayType?: string
  clientEventInfo?: ClientEventInfo
  value?: string
  cursorType?: string
}

interface Item {
  entryId: string
  item: Item2
}

interface Item2 {
  itemContent: ItemContent
}

interface ItemContent {
  itemType: string
  __typename: string
  tweet_results: TweetResults
  tweetDisplayType: string
}

interface TweetResults {
  result: Result2
}

interface Result2 {
  __typename: string
  rest_id?: string
  core?: Core
  unmention_data?: UnmentionData
  edit_control?: EditControl
  is_translatable?: boolean
  views?: Views
  source?: string
  legacy?: Legacy2
  birdwatch_pivot?: BirdwatchPivot
  tweet?: Tweet
  limitedActionResults?: LimitedActionResults
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
  affiliates_highlighted_label: AffiliatesHighlightedLabel
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy
  professional: Professional
  super_follow_eligible: boolean
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
  profile_banner_url: string
  profile_image_url_https: string
  profile_interstitial_type: string
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

interface Professional {
  rest_id: string
  professional_type: string
  category: any[]
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
  extended_entities: ExtendedEntities
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
  in_reply_to_screen_name?: string
  in_reply_to_status_id_str?: string
  in_reply_to_user_id_str?: string
}

interface Entities2 {
  hashtags: any[]
  media: Medum[]
  symbols: any[]
  timestamps: any[]
  urls: any[]
  user_mentions: UserMention[]
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
  source_status_id_str?: string
  source_user_id_str?: string
  additional_media_info?: AdditionalMediaInfo
  allow_download_status?: AllowDownloadStatus
  video_info?: VideoInfo
}

interface ExtMediaAvailability {
  status: string
}

interface Features {
  large: Large
  medium: Medium
  small: Small
  orig: Orig
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
  result: Result4
}

interface Result4 {
  media_key: string
}

interface AdditionalMediaInfo {
  monetizable: boolean
  source_user: SourceUser
  title?: string
  description?: string
  embeddable?: boolean
}

interface SourceUser {
  user_results: UserResults2
}

interface UserResults2 {
  result: Result5
}

interface Result5 {
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
  super_follow_eligible?: boolean
}

interface AffiliatesHighlightedLabel2 {
  label: Label2
}

interface Label2 {
  url: Url2
  badge: Badge2
  description: string
  userLabelType: string
  userLabelDisplayType: string
}

interface Url2 {
  url: string
  urlType: string
}

interface Badge2 {
  url: string
}

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
  verified_type?: string
}

interface Entities3 {
  description: Description2
  url: Url4
}

interface Description2 {
  urls: Url3[]
}

interface Url3 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
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
  category: Category[]
}

interface Category {
  id: number
  name: string
  icon_name: string
}

interface AllowDownloadStatus {
  allow_download: boolean
}

interface VideoInfo {
  aspect_ratio: number[]
  duration_millis: number
  variants: Variant[]
}

interface Variant {
  bitrate?: number
  content_type: string
  url: string
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
  source_status_id_str?: string
  source_user_id_str?: string
  additional_media_info?: AdditionalMediaInfo2
  allow_download_status?: AllowDownloadStatus2
  video_info?: VideoInfo2
}

interface ExtMediaAvailability2 {
  status: string
}

interface Features2 {
  large: Large3
  medium: Medium3
  small: Small3
  orig: Orig2
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
  result: Result6
}

interface Result6 {
  media_key: string
}

interface AdditionalMediaInfo2 {
  monetizable: boolean
  source_user: SourceUser2
  title?: string
  description?: string
  embeddable?: boolean
}

interface SourceUser2 {
  user_results: UserResults3
}

interface UserResults3 {
  result: Result7
}

interface Result7 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel3
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy4
  professional?: Professional3
  verified_phone_status: boolean
  super_follow_eligible?: boolean
}

interface AffiliatesHighlightedLabel3 {
  label: Label3
}

interface Label3 {
  url: Url6
  badge: Badge3
  description: string
  userLabelType: string
  userLabelDisplayType: string
}

interface Url6 {
  url: string
  urlType: string
}

interface Badge3 {
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
  url: Url8
}

interface Description3 {
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

interface AllowDownloadStatus2 {
  allow_download: boolean
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

interface BirdwatchPivot {
  callToAction: CallToAction
  destinationUrl: string
  footer: Footer
  note: Note
  subtitle: Subtitle
  title: string
  shorttitle: string
  visualStyle: string
  iconType: string
}

interface CallToAction {
  prompt: string
  title: string
  destinationUrl: string
}

interface Footer {
  text: string
  entities: Entity[]
}

interface Entity {
  fromIndex: number
  toIndex: number
  ref: Ref
}

interface Ref {
  type: string
  url: string
  urlType: string
}

interface Note {
  rest_id: string
}

interface Subtitle {
  text: string
  entities: Entity2[]
}

interface Entity2 {
  fromIndex: number
  toIndex: number
  ref: Ref2
}

interface Ref2 {
  type: string
  url: string
  urlType: string
}

interface Tweet {
  rest_id: string
  core: Core2
  unmention_data: UnmentionData2
  edit_control: EditControl2
  is_translatable: boolean
  views: Views2
  source: string
  author_community_relationship: AuthorCommunityRelationship
  legacy: Legacy10
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
  professional: Professional4
  super_follow_eligible: boolean
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel4 {
  label: Label4
}

interface Label4 {
  url: Url10
  badge: Badge4
  description: string
  userLabelType: string
  userLabelDisplayType: string
}

interface Url10 {
  url: string
  urlType: string
}

interface Badge4 {
  url: string
}

interface Legacy5 {
  following: boolean
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
  pinned_tweet_ids_str: string[]
  possibly_sensitive: boolean
  profile_banner_url: string
  profile_image_url_https: string
  profile_interstitial_type: string
  screen_name: string
  statuses_count: number
  translator_type: string
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities5 {
  description: Description4
}

interface Description4 {
  urls: any[]
}

interface Professional4 {
  rest_id: string
  professional_type: string
  category: any[]
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

interface AuthorCommunityRelationship {
  community_results: CommunityResults
  role: string
  user_results: UserResults5
}

interface CommunityResults {
  result: Result9
}

interface Result9 {
  __typename: string
  id_str: string
  name: string
  description: string
  created_at: number
  question: string
  search_tags: string[]
  is_nsfw: boolean
  actions: Actions
  admin_results: AdminResults
  creator_results: CreatorResults
  invites_result: InvitesResult
  join_policy: string
  invites_policy: string
  is_pinned: boolean
  members_facepile_results: MembersFacepileResult[]
  moderator_count: number
  member_count: number
  role: string
  rules: Rule[]
  custom_banner_media: CustomBannerMedia
  default_banner_media: DefaultBannerMedia
  viewer_relationship: ViewerRelationship
  join_requests_result: JoinRequestsResult
}

interface Actions {
  delete_action_result: DeleteActionResult
  join_action_result: JoinActionResult
  leave_action_result: LeaveActionResult
  pin_action_result: PinActionResult
}

interface DeleteActionResult {
  __typename: string
  reason: string
}

interface JoinActionResult {
  __typename: string
}

interface LeaveActionResult {
  __typename: string
  reason: string
  message: string
}

interface PinActionResult {
  __typename: string
}

interface AdminResults {
  result: Result10
}

interface Result10 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel5
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy6
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel5 {
  label: Label5
}

interface Label5 {
  url: Url11
  badge: Badge5
  description: string
  userLabelType: string
  userLabelDisplayType: string
}

interface Url11 {
  url: string
  urlType: string
}

interface Badge5 {
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
  url: string
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities6 {
  description: Description5
  url: Url12
}

interface Description5 {
  urls: any[]
}

interface Url12 {
  urls: Url13[]
}

interface Url13 {
  display_url: string
  expanded_url: string
  url: string
  indices: number[]
}

interface CreatorResults {
  result: Result11
}

interface Result11 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel6
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy7
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel6 {
  label: Label6
}

interface Label6 {
  url: Url14
  badge: Badge6
  description: string
  userLabelType: string
  userLabelDisplayType: string
}

interface Url14 {
  url: string
  urlType: string
}

interface Badge6 {
  url: string
}

interface Legacy7 {
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
}

interface Entities7 {
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

interface InvitesResult {
  __typename: string
  reason: string
  message: string
}

interface MembersFacepileResult {
  result: Result12
}

interface Result12 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel7
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy8
  verified_phone_status: boolean
  professional?: Professional5
}

interface AffiliatesHighlightedLabel7 {
  label?: Label7
}

interface Label7 {
  url: Url17
  badge: Badge7
  description: string
  userLabelType: string
  userLabelDisplayType: string
}

interface Url17 {
  url: string
  urlType: string
}

interface Badge7 {
  url: string
}

interface Legacy8 {
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
  profile_banner_url?: string
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

interface Entities8 {
  description: Description7
  url?: Url18
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

interface Rule {
  rest_id: string
  name: string
  description?: string
}

interface CustomBannerMedia {
  media_info: MediaInfo
}

interface MediaInfo {
  color_info: ColorInfo
  original_img_url: string
  original_img_width: number
  original_img_height: number
  salient_rect: SalientRect
}

interface ColorInfo {
  palette: Palette[]
}

interface Palette {
  rgb: Rgb
  percentage: number
}

interface Rgb {
  red: number
  green: number
  blue: number
}

interface SalientRect {
  left: number
  top: number
  width: number
  height: number
}

interface DefaultBannerMedia {
  media_info: MediaInfo2
}

interface MediaInfo2 {
  color_info: ColorInfo2
  original_img_url: string
  original_img_width: number
  original_img_height: number
}

interface ColorInfo2 {
  palette: Palette2[]
}

interface Palette2 {
  rgb: Rgb2
  percentage: number
}

interface Rgb2 {
  red: number
  green: number
  blue: number
}

interface ViewerRelationship {
  moderation_state: ModerationState
}

interface ModerationState {
  __typename: string
}

interface JoinRequestsResult {
  __typename: string
}

interface UserResults5 {
  result: Result13
}

interface Result13 {
  __typename: string
  id: string
  rest_id: string
  affiliates_highlighted_label: AffiliatesHighlightedLabel8
  has_graduated_access: boolean
  is_blue_verified: boolean
  profile_image_shape: string
  legacy: Legacy9
  professional: Professional6
  super_follow_eligible: boolean
  verified_phone_status: boolean
}

interface AffiliatesHighlightedLabel8 {
  label: Label8
}

interface Label8 {
  url: Url20
  badge: Badge8
  description: string
  userLabelType: string
  userLabelDisplayType: string
}

interface Url20 {
  url: string
  urlType: string
}

interface Badge8 {
  url: string
}

interface Legacy9 {
  following: boolean
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
  verified: boolean
  want_retweets: boolean
  withheld_in_countries: any[]
}

interface Entities9 {
  description: Description8
}

interface Description8 {
  urls: any[]
}

interface Professional6 {
  rest_id: string
  professional_type: string
  category: any[]
}

interface Legacy10 {
  bookmark_count: number
  bookmarked: boolean
  created_at: string
  conversation_id_str: string
  display_text_range: number[]
  entities: Entities10
  extended_entities: ExtendedEntities2
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
  user_id_str: string
  id_str: string
}

interface Entities10 {
  hashtags: any[]
  media: Medum3[]
  symbols: any[]
  timestamps: any[]
  urls: any[]
  user_mentions: any[]
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
}

interface ExtMediaAvailability3 {
  status: string
}

interface Features3 {
  large: Large5
  medium: Medium5
  small: Small5
  orig: Orig3
}

interface Large5 {
  faces: any[]
}

interface Medium5 {
  faces: any[]
}

interface Small5 {
  faces: any[]
}

interface Orig3 {
  faces: any[]
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
}

interface ExtMediaAvailability4 {
  status: string
}

interface Features4 {
  large: Large7
  medium: Medium7
  small: Small7
  orig: Orig4
}

interface Large7 {
  faces: any[]
}

interface Medium7 {
  faces: any[]
}

interface Small7 {
  faces: any[]
}

interface Orig4 {
  faces: any[]
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

interface LimitedActionResults {
  limited_actions: LimitedAction[]
}

interface LimitedAction {
  action: string
  prompt?: Prompt
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

interface ClientEventInfo {
  component: string
}

interface Metadata {
  scribeConfig: ScribeConfig
}

interface ScribeConfig {
  page: string
}
