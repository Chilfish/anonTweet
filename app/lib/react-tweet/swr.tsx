'use client'

import type { ReactNode } from 'react'
import type { TwitterComponents } from './twitter-theme/components.js'
import type { TweetCoreProps } from './utils.js'
import { useTweet } from './hooks.js'
import {
  EmbeddedTweet,
  TweetNotFound,
  TweetSkeleton,

} from './twitter-theme/components.js'

export type TweetProps = Omit<TweetCoreProps, 'id'> & {
  fallback?: ReactNode
  components?: TwitterComponents
  fetchOptions?: RequestInit
} & (
  | {
    id: string
    apiUrl?: string
  }
  | {
    id?: string
    apiUrl: string | undefined
  }
  )

export function Tweet({
  id,
  apiUrl,
  fallback = <TweetSkeleton />,
  components,
  fetchOptions,
  onError,
}: TweetProps) {
  const { data, error, isLoading } = useTweet(id, apiUrl, fetchOptions)

  if (isLoading)
    return fallback
  if (error || !data) {
    const NotFound = components?.TweetNotFound || TweetNotFound
    return <NotFound error={onError ? onError(error) : error} />
  }

  return <EmbeddedTweet tweet={data} components={components} />
}
