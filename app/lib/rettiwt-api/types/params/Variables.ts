/**
 * Media to be sent as payload.
 *
 * @internal
 */
export interface IMediaVariable {

  media_entities: IMediaEntityVariable[]
  possibly_sensitive: boolean

}

/**
 * Each media item in the media payload.
 *
 * @internal
 */
export interface IMediaEntityVariable {

  media_id: string
  tagged_users: string[]

}

/**
 * Reply specific details to be sent in payload.
 *
 * @internal
 */
export interface IReplyVariable {

  exclude_reply_user_ids: string[]
  in_reply_to_tweet_id: string

}
