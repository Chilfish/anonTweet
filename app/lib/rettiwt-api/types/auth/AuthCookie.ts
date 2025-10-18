/**
 * The cookie containing the tokens that are used to authenticate against Twitter.
 *
 * @public
 */
export interface IAuthCookie {

  /** The bearer token from twitter.com. */
  auth_token: string

  /** The CSRF token for the session. */
  ct0: string

  /** Token used to authenticate a device. */
  kdt: string

  /** Token used to authenticate a user using a Twitter ID. */
  twid: string

}
