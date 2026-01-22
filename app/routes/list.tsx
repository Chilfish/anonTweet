import type { FormEvent } from 'react'
import type { Route } from './+types/tweet'
import type { TweetData } from '~/types'
import axios from 'axios'

import { memo, Suspense, useMemo, useState } from 'react'
import { Await, useLoaderData, useNavigate } from 'react-router'
import { BackButton } from '~/components/translation/BackButton'
import { MyTweet } from '~/components/tweet/Tweet'
import { Button } from '~/components/ui/button'
import { Field } from '~/components/ui/field'
import { Form } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { TweetNotFound, TweetSkeleton } from '~/lib/react-tweet'

export function HydrateFallback() {
  return (
    <div className="w-full max-w-2xl">
      <TweetSkeleton />
    </div>
  )
}

export async function clientLoader({
  params,
}: Route.LoaderArgs): Promise<Response | {
  tweets: TweetData
  listId: string
}> {
  const { id } = params
  if (!id) {
    return {
      tweets: [],
      listId: '',
    }
  }
  const { data: tweets } = await axios.get<TweetData>(`/api/tweet/list/${id}`)
  return {
    tweets,
    listId: id,
  }
}

const MemoizedTweetItem = memo(({ tweet }: { tweet: any }) => {
  const wrappedTweets = useMemo(() => [tweet], [tweet])
  return (
    <MyTweet
      tweets={wrappedTweets}
      mainTweetId={tweet.id_str}
    />
  )
})

function TweetContent() {
  const loaderData = useLoaderData<typeof clientLoader>()

  return (
    <Suspense fallback={<HydrateFallback />}>
      <Await
        resolve={loaderData}
        errorElement={<TweetNotFound />}
        children={resolvedTweet => (
          <div className="flex flex-col gap-3 items-center justify-center w-[96vw]">
            {resolvedTweet.tweets.length
              ? (resolvedTweet.tweets as any[]).map(tweet => (
                  <MemoizedTweetItem
                    tweet={tweet}
                    key={tweet.id_str}
                  />
                ))
              : (
                  <TweetNotFound
                    tweetId={resolvedTweet.listId}
                  />
                )}
          </div>
        )}
      />
    </Suspense>
  )
}

function ListIdInputForm() {
  const navigator = useNavigate()
  const [loading, setLoading] = useState(false)
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)

    navigator(`/list/${formData.get('listId')}`)
  }

  return (
    <Form className="justify-center flex-row items-center" onSubmit={onSubmit}>
      <Field name="listId">
        <Input
          disabled={loading}
          placeholder="Twitter List ID"
          required
          type="text"
          className="max-w-64"
          autoFocus
          autoComplete="off"
        />
      </Field>
      <Button disabled={loading} type="submit">
        Submit
      </Button>
    </Form>
  )
}

export default function TweetPage({
  params,
  loaderData,
}: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-4 px-1">
      <div className="flex items-center w-full gap-4">
        <BackButton />
        <ListIdInputForm />
      </div>

      <TweetContent />
    </div>
  )
}
