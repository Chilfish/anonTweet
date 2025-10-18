import type { IMediaEntityVariable, IMediaVariable, IReplyVariable } from '../../types/params/Variables'
import type { NewTweetMedia } from '../args/PostArgs'

/**
 * Media to be sent as payload.
 *
 * @internal
 */
export class MediaVariable implements IMediaVariable {
  public media_entities: MediaEntityVariable[]
  public possibly_sensitive: boolean

  /**
   * @param media - The list of NewTweetMedia objects specifying the media items to be sent in the Tweet.
   */
  public constructor(media: NewTweetMedia[]) {
    this.media_entities = media.map(item => new MediaEntityVariable(item))
    this.possibly_sensitive = false
  }
}

/**
 * Each media item in the media payload.
 *
 * @internal
 */
export class MediaEntityVariable implements IMediaEntityVariable {
  public media_id: string
  public tagged_users: string[]

  /**
   * @param media - The NewTweetMedia object specifying the details of the media item to be included in the payload.
   */
  public constructor(media: NewTweetMedia) {
    this.media_id = media.id
    this.tagged_users = media.tags ?? []
  }
}

/**
 * Reply specific details to be sent in payload.
 *
 * @internal
 */
export class ReplyVariable implements IReplyVariable {
  public exclude_reply_user_ids: string[]
  public in_reply_to_tweet_id: string

  /**
   * @param replyTo - The id of the Tweet to which this Tweet is a reply.
   */
  public constructor(replyTo: string) {
    this.in_reply_to_tweet_id = replyTo
    this.exclude_reply_user_ids = []
  }
}
