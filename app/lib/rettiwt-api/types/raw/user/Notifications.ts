/**
 * The raw data received when fetching the notifications of the given user.
 *
 * @public
 */
export interface IUserNotificationsResponse {
  globalObjects: GlobalObjects
  timeline: Timeline
}

interface GlobalObjects {
  notifications: Notifications
}

interface Notifications {
  [key: string]: Notification
}

interface Notification {
  id: string
  timestampMs: string
  icon: Icon
  message: Message
  template: Template
}

interface Icon {
  id: string
}

interface Message {
  text: string
  entities: Entity[]
  rtl: boolean
}

interface Entity {
  fromIndex: number
  toIndex: number
  format: string
}

interface Template {
  aggregateUserActionsV1: AggregateUserActionsV1
}

interface AggregateUserActionsV1 {
  targetObjects: TargetObject[]
  fromUsers: FromUser[]
  additionalContext: AdditionalContext
}

interface TargetObject {
  tweet: Tweet
}

interface Tweet {
  id: string
}

interface FromUser {
  user: User
}

interface User {
  id: string
}

interface AdditionalContext {
  contextText: ContextText
}

interface ContextText {
  text: string
  entities: any[]
}

interface Timeline {
  id: string
  instructions: Instruction[]
}

interface Instruction {
  clearCache?: ClearCache
  addEntries?: AddEntries
  clearEntriesUnreadState?: ClearEntriesUnreadState
  markEntriesUnreadGreaterThanSortIndex?: MarkEntriesUnreadGreaterThanSortIndex
}

interface ClearCache {}

interface AddEntries {
  entries: Entry[]
}

interface Entry {
  entryId: string
  sortIndex: string
  content: Content
}

interface Content {
  operation?: Operation
  item?: Item
}

interface Operation {
  cursor: Cursor
}

interface Cursor {
  value: string
  cursorType: string
}

interface Item {
  content: Content2
  clientEventInfo: ClientEventInfo
  feedbackInfo?: FeedbackInfo
}

interface Content2 {
  notification: Notification2
}

interface Notification2 {
  id: string
  url: Url
  fromUsers: string[]
  targetTweets: string[]
}

interface Url {
  urlType: string
  url: string
  urtEndpointOptions?: UrtEndpointOptions
}

interface UrtEndpointOptions {
  title: string
  cacheId: string
}

interface ClientEventInfo {
  component: string
  element: string
  details: Details
}

interface Details {
  notificationDetails: NotificationDetails
}

interface NotificationDetails {
  impressionId: string
  metadata: string
}

interface FeedbackInfo {
  feedbackKeys: string[]
  feedbackMetadata: string
  clientEventInfo: ClientEventInfo2
}

interface ClientEventInfo2 {
  element: string
}

interface ClearEntriesUnreadState {}

interface MarkEntriesUnreadGreaterThanSortIndex {
  sortIndex: string
}
