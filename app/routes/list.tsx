import type { FormEvent } from 'react'
import type { Route } from './+types/list'
import type { EnrichedTweet, TweetData } from '~/types'
import axios from 'axios'
import { AlertTriangleIcon, ListIcon } from 'lucide-react'
import { memo, useEffect, useMemo, useState } from 'react'
import { useLoaderData, useNavigate, useNavigation, useRevalidator } from 'react-router'
import { BackButton } from '~/components/translation/BackButton'
import { MyTweet } from '~/components/tweet/Tweet'
import { Button } from '~/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '~/components/ui/empty'
import { Form } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { TweetSkeleton } from '~/lib/react-tweet'
import { buildMeta } from '~/lib/seo'
import { extractListId } from '~/lib/url-detect'

export function meta() {
  return buildMeta({
    title: 'Twitter 列表查看 | Anon Tweet',
    description: '查看 Twitter/X 列表内容，支持按列表 ID 或列表链接浏览推文。',
    noindex: true,
  })
}

export function HydrateFallback() {
  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col gap-3 px-3 sm:px-0">
      <TweetSkeleton />
      <TweetSkeleton />
    </div>
  )
}

export async function clientLoader({ params }: Route.LoaderArgs) {
  const raw = params.id ?? ''
  const listId = extractListId(raw)

  if (!listId) {
    return {
      tweets: [] as TweetData,
      listId: raw,
      error: '列表 ID 无效，请检查链接格式。',
    }
  }

  try {
    const { data } = await axios.get<TweetData>(`/api/tweet/list/${listId}`)
    return { tweets: data, listId, error: null }
  }
  catch {
    return {
      tweets: [] as TweetData,
      listId,
      error: `列表 ${listId} 加载失败，请检查 ID 或稍后重试。`,
    }
  }
}

const MemoizedTweetItem = memo(({ tweet }: { tweet: EnrichedTweet }) => {
  const wrappedTweets = useMemo(() => [tweet], [tweet])
  return (
    <MyTweet
      tweets={wrappedTweets}
      mainTweetId={tweet.id_str}
    />
  )
})

function ListIdForm({ listId }: { listId: string }) {
  const navigate = useNavigate()
  const navigation = useNavigation()
  const [value, setValue] = useState(listId)
  const [error, setError] = useState('')

  useEffect(() => {
    setValue(listId)
  }, [listId])

  const isPending = navigation.state !== 'idle'
    && navigation.location?.pathname.startsWith('/list/')

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const next = extractListId(value)
    if (!next) {
      setError('请输入列表 ID 或 x.com/i/lists/… 链接。')
      return
    }
    setError('')
    navigate(`/list/${next}`)
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-3 sm:p-4">
      <h1 className="text-sm font-semibold">查看列表</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        粘贴公开列表的 ID 或链接，查看其中的推文。
      </p>

      <Form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={onSubmit}
      >
        <Label htmlFor="list-id" className="sr-only">
          列表 ID 或链接
        </Label>
        <Input
          id="list-id"
          name="listId"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="列表 ID 或 x.com/i/lists/…"
          className="min-w-0 flex-1 font-mono text-sm"
          autoComplete="off"
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? '加载中...' : '查看列表'}
        </Button>
      </Form>

      {error && (
        <p className="mt-2 text-xs text-destructive-foreground">
          {error}
        </p>
      )}
    </section>
  )
}

export default function ListPage(_props: Route.ComponentProps) {
  const { tweets, listId, error } = useLoaderData<typeof clientLoader>()
  const revalidator = useRevalidator()

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[600px] flex-col gap-4 px-3 sm:px-0">
      <div className="flex w-full">
        <BackButton />
      </div>

      <ListIdForm listId={listId} />

      {error
        ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertTriangleIcon />
                </EmptyMedia>
                <EmptyTitle>列表加载失败</EmptyTitle>
                <EmptyDescription>
                  {error}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={revalidator.state !== 'idle'}
                  onClick={() => revalidator.revalidate()}
                >
                  {revalidator.state === 'idle'
                    ? '重试'
                    : '重试中...'}
                </Button>
              </EmptyContent>
            </Empty>
          )
        : tweets.length === 0
          ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ListIcon />
                  </EmptyMedia>
                  <EmptyTitle>列表里还没有推文</EmptyTitle>
                  <EmptyDescription>
                    该列表可能为空，或列表成员近期没有发布内容。
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )
          : (
              <>
                <div className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-2">
                  <h2 className="text-sm font-semibold">列表推文</h2>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {`共 ${tweets.length} 条`}
                  </span>
                </div>

                <div className="flex w-full flex-col items-center gap-3">
                  {tweets.map(tweet => (
                    <MemoizedTweetItem
                      tweet={tweet}
                      key={tweet.id_str}
                    />
                  ))}
                </div>
              </>
            )}
    </div>
  )
}
