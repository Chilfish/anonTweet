import type { AxiosRequestConfig } from 'axios'
import type { EnrichedTweet } from '../utils.js'
import type { Tweet } from './types/index.js'
import { enrichTweet } from '../utils.js'
import { fetchTweet } from './fetch-tweet.js'

/**
 * Returns a tweet from the Twitter syndication API.
 */
export async function getTweet(
  id: string,
  fetchOptions?: AxiosRequestConfig,
): Promise<Tweet | null> {
  const { data, tombstone, notFound } = await fetchTweet(id, fetchOptions)

  if (notFound) {
    console.error(
      `The tweet ${id} does not exist or has been deleted by the account owner. Update your code to remove this tweet when possible.`,
    )
  }
  else if (tombstone) {
    console.error(
      `The tweet ${id} has been made private by the account owner. Update your code to remove this tweet when possible.`,
    )
  }

  return data
}

export async function getEnrichedTweet(
  id: string,
  fetchOptions?: AxiosRequestConfig,
): Promise<EnrichedTweet | null> {
  const tweet = await getTweet(id, fetchOptions)
  if (!tweet) {
    return null
  }
  // console.log(tweet)
  return enrichTweet(tweet)
}
