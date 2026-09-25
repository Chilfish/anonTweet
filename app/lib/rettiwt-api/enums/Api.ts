/**
 * The different types of api error messages.
 *
 * @public
 */
export enum ApiErrors {
  COULD_NOT_AUTHENTICATE = 'Failed to authenticate',
  BAD_AUTHENTICATION = 'Invalid authentication data',
  RESOURCE_NOT_ALLOWED = 'Not authorized to access requested resource',
  HOMEPAGE_FETCH_FAILED = 'Unable to fetch the X page shell required to generate the client transaction ID',
}
