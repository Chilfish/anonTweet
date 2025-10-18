import type { IUser } from '../base/User'
import type { IDataResult } from './DataResult'

/**
 * Represents the raw data of a single timeline user.
 *
 * @public
 */
export interface ITimelineUser {
  user_results: IDataResult<IUser>
}
