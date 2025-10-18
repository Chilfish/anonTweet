import type { NotificationType } from '../../enums/Notification'

/**
 * The details of a single notification.
 *
 * @public
 */
export interface INotification {
  /** The list of id of the users from whom the notification was received. */
  from: string[]

  /** The id of the notification. */
  id: string

  /** The text contents of the notification. */
  message: string

  /** The date/time at which the notification was received. */
  receivedAt: string

  /** The list of id of the target tweet(s) of the notification. */
  target: string[]

  /** The type of notification. */
  type?: NotificationType
}
