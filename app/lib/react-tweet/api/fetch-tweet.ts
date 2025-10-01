import type { AxiosRequestConfig } from 'axios'
import type { Tweet } from './types/index.js'
import Axios from 'axios'
import { setupCache } from 'axios-cache-interceptor'

const SYNDICATION_URL = import.meta.env.VITE_API_URL || 'https://cdn.syndication.twimg.com'

const instance = Axios.create()
const axios = setupCache(instance)

export class TwitterApiError extends Error {
  status: number
  data: any

  constructor({
    message,
    status,
    data,
  }: {
    message: string
    status: number
    data: any
  }) {
    super(message)
    this.name = 'TwitterApiError'
    this.status = status
    this.data = data
  }
}

const TWEET_ID = /^\d+$/

function getToken(id: string) {
  return ((Number(id) / 1e15) * Math.PI)
    .toString(6 ** 2)
    .replace(/(0+|\.)/g, '')
}

/**
 * Fetches a tweet from the Twitter syndication API.
 */
export async function fetchTweet(
  id: string,
  fetchOptions?: AxiosRequestConfig,
): Promise<{ data: Tweet | null, tombstone?: true, notFound?: true }> {
  if (id.length > 40 || !TWEET_ID.test(id)) {
    throw new Error(`Invalid tweet id: ${id}`)
  }

  const url = new URL(`${SYNDICATION_URL}/tweet-result`)

  url.searchParams.set('id', id)
  url.searchParams.set('lang', 'en')
  url.searchParams.set(
    'features',
    [
      'tfw_timeline_list:',
      'tfw_follower_count_sunset:true',
      'tfw_tweet_edit_backend:on',
      'tfw_refsrc_session:on',
      'tfw_fosnr_soft_interventions_enabled:on',
      'tfw_show_birdwatch_pivots_enabled:on',
      'tfw_show_business_verified_badge:on',
      'tfw_duplicate_scribes_to_settings:on',
      'tfw_use_profile_image_shape_enabled:on',
      'tfw_show_blue_verified_badge:on',
      'tfw_legacy_timeline_sunset:true',
      'tfw_show_gov_verified_badge:on',
      'tfw_show_business_affiliate_badge:on',
      'tfw_tweet_edit_frontend:on',
    ].join(';'),
  )
  url.searchParams.set('token', getToken(id))

  try {
    const res = await axios.get(url.toString(), {
      ...fetchOptions,
      validateStatus: status => status < 500, // 不要对 4xx 状态码抛出异常
    })

    if (res.status === 200) {
      if (res.data?.__typename === 'TweetTombstone') {
        return { tombstone: true, data: null }
      }
      return { data: res.data }
    }
    if (res.status === 404) {
      return { notFound: true, data: null }
    }

    throw new TwitterApiError({
      message:
        typeof res.data?.error === 'string'
          ? res.data.error
          : `Failed to fetch tweet at "${url}" with "${res.status}".`,
      status: res.status,
      data: res.data,
    })
  }
  catch (error: any) {
    // 处理网络错误或其他 axios 错误
    if (error instanceof TwitterApiError) {
      throw error
    }

    console.error(error)

    const status = error.response?.status || 500
    const data = error.response?.data || null
    const message = `${error.name}: ${error.message || `Failed to fetch tweet at "${url}".`}`

    throw new TwitterApiError({
      message,
      status,
      data,
    })
  }
}
