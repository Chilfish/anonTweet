import type { MediaDetails } from './media'
import type { TweetUser } from './user'

export interface TweetEditControl {
  edit_tweet_ids: string[]
  editable_until_msecs: string
  is_edit_eligible: boolean
  edits_remaining: string
}

/**
 * Base tweet information shared by a tweet, a parent tweet and a quoted tweet.
 */
export interface TweetBase {
  /**
   * Language code of the tweet. E.g "en", "es".
   */
  lang: string
  /**
   * Creation date of the tweet in the format ISO 8601.
   */
  created_at: string
  /**
   * Text range of the tweet text.
   */
  // display_text_range: number[]
  /**
   * All the entities that are part of the tweet. Like hashtags, mentions, urls, etc.
   */
  entities: any[]
  /**
   * The unique identifier of the tweet.
   */
  id_str: string
  /**
   * The tweet text, including the raw text from the entities.
   */
  text: string
  /**
   * Information about the user who posted the tweet.
   */
  user: TweetUser
  /**
   * Edit information about the tweet.
   */
  edit_control: TweetEditControl
  isEdited: boolean
  isStaleEdit: boolean
}

/**
 * A tweet as returned by the the Twitter syndication API.
 */
export interface Tweet extends TweetBase {
  __typename: 'Tweet'
  // favorite_count: number
  mediaDetails?: MediaDetails[]
  // photos?: TweetPhoto[]
  // video?: TweetVideo
  // conversation_count: number
  news_action_type: 'conversation'
  quoted_tweet?: QuotedTweet
  in_reply_to_status_id_str?: string
  // parent?: TweetParent
  possibly_sensitive?: boolean
  card?: any
}

/**
 * The parent tweet of a tweet reply.
 */
export interface TweetParent extends TweetBase {
  reply_count: number
  retweet_count: number
  favorite_count: number
}

/**
 * A tweet quoted by another tweet.
 */
export interface QuotedTweet extends TweetBase {
  reply_count: number
  retweet_count: number
  favorite_count: number
  mediaDetails?: MediaDetails[]
  self_thread: {
    id_str: string
  }
}
