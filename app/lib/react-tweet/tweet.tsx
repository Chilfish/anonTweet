import type { TweetProps } from './swr.js'
import { Suspense } from 'react'
import { getTweet } from './api/index.js'
import {
  EmbeddedTweet,
  TweetNotFound,
  TweetSkeleton,
} from './twitter-theme/components.js'

// This is not ideal because we don't use the `apiUrl` prop here and `id` is required. But as the
// type is shared with the SWR version when the Tweet component is imported, we need to have a type
// that supports both versions of the component.
export type { TweetProps }

type TweetContentProps = Omit<TweetProps, 'fallback'>

async function TweetContent({
  id,
  components,
  fetchOptions,
  onError,
}: TweetContentProps) {
  let error
  const tweet = id
    ? await getTweet(id, fetchOptions).catch((err) => {
        if (onError) {
          error = onError(err)
        }
        else {
          console.error(err)
          error = err
        }
      })
    : undefined

  if (!tweet) {
    const NotFound = components?.TweetNotFound || TweetNotFound
    return <NotFound error={error} />
  }

  return <EmbeddedTweet tweet={tweet} components={components} />
}

export function Tweet({
  fallback = <TweetSkeleton />,
  ...props
}: TweetProps) {
  return (
    <Suspense fallback={fallback}>
      <TweetContent {...props} />
    </Suspense>
  )
}
