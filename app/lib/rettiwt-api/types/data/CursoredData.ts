import type { IConversation } from './Conversation'
import type { IDirectMessage } from './DirectMessage'
import type { IList } from './List'
import type { INotification } from './Notification'
import type { ITweet } from './Tweet'
import type { IUser } from './User'

/**
 * The data that is fetched batch-wise using a cursor.
 *
 * @typeParam T - Type of data to be stored.
 *
 * @public
 */
export interface ICursoredData<T extends IDirectMessage | IConversation | INotification | ITweet | IUser | IList> {
  /** The batch of data of the given type. */
  list: T[]

  /** The cursor to the next batch of data. */
  next: string
}
