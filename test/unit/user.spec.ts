import type { IUserDetailsResponse } from '@chilfish/tweet'
import { Extractors } from '@chilfish/tweet/internals'
import { describe, expect, it } from 'vitest'
import { loadFixture } from '../helpers/load-fixture'

/**
 * test/unit/user.spec.ts
 *
 * USER_DETAILS_BY_USERNAME 反序列化：无置顶推文的账号上游会**整个省略**
 * `legacy.pinned_tweet_ids_str`（实测 /api/user/get/ukyomigi 曾因此 500）。
 */
const userDetails = loadFixture<IUserDetailsResponse>('user/details-no-pinned.json')

describe('user.single', () => {
  it('deserializes user whose legacy omits pinned_tweet_ids_str', () => {
    const user = Extractors.USER_DETAILS_BY_USERNAME(userDetails)

    expect(user).toBeDefined()
    expect(user?.userName).toBe('ukyomigi')
    expect(user?.fullName).toBe('右京｜デザイン')
    expect(user?.followersCount).toBe(90)
    expect(user?.pinnedTweets).toEqual([])
  })

  it('keeps pinnedTweets when upstream provides pinned_tweet_ids_str', () => {
    const withPinned = {
      ...userDetails,
      data: {
        user: {
          result: {
            ...userDetails.data.user.result,
            legacy: {
              ...userDetails.data.user.result.legacy,
              pinned_tweet_ids_str: ['1234567890'],
            },
          },
        },
      },
    } as IUserDetailsResponse

    expect(Extractors.USER_DETAILS_BY_USERNAME(withPinned)?.pinnedTweets).toEqual(['1234567890'])
  })
})
