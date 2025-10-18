import type { INotification } from '../../types/data/Notification'
import type { INotification as IRawNotification } from '../../types/raw/base/Notification'
import type { IUserNotificationsResponse } from '../../types/raw/user/Notifications'
import { NotificationType } from '../../enums/Notification'
import { RawNotificationType } from '../../enums/raw/Notification'
import { findKeyByValue } from '../../helper/JsonUtils'

/**
 * The details of a single notification.
 *
 * @public
 */
export class Notification implements INotification {
  /** The raw notification details. */
  private readonly _raw: IRawNotification

  public from: string[]
  public id: string
  public message: string
  public receivedAt: string
  public target: string[]
  public type?: NotificationType

  /**
   * @param notification - The raw notification details.
   */
  public constructor(notification: IRawNotification) {
    this._raw = { ...notification }

    // Getting the original notification type
    const notificationType: string | undefined = findKeyByValue(RawNotificationType, notification.icon.id)

    this.from = notification.template?.aggregateUserActionsV1?.fromUsers
      ? notification.template.aggregateUserActionsV1.fromUsers.map(item => item.user.id)
      : []
    this.id = notification.id
    this.message = notification.message.text
    this.receivedAt = new Date(Number(notification.timestampMs)).toISOString()
    this.target = notification.template?.aggregateUserActionsV1?.targetObjects
      ? notification.template.aggregateUserActionsV1.targetObjects.map(item => item.tweet.id)
      : []
    this.type = notificationType
      ? NotificationType[notificationType as keyof typeof NotificationType]
      : NotificationType.UNDEFINED
  }

  /** The raw notification details. */
  public get raw(): IRawNotification {
    return { ...this._raw }
  }

  /**
   * Extracts and deserializes the list of notifications from the given raw response data.
   *
   * @param response - The raw response data.
   *
   * @returns The deserialized list of notifications.
   */
  public static list(response: NonNullable<unknown>): Notification[] {
    const notifications: Notification[] = []

    // Extracting notifications
    if ((response as IUserNotificationsResponse).globalObjects.notifications) {
      // Iterating over the raw list of notifications
      for (const [, value] of Object.entries(
        (response as IUserNotificationsResponse).globalObjects.notifications,
      )) {
        notifications.push(new Notification(value as IRawNotification))
      }
    }

    return notifications
  }

  /**
   * @returns A serializable JSON representation of `this` object.
   */
  public toJSON(): INotification {
    return {
      from: this.from,
      id: this.id,
      message: this.message,
      receivedAt: this.receivedAt,
      target: this.target,
      type: this.type,
    }
  }
}
