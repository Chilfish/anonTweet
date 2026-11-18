import { ContinueReading } from '~/components/home/ContinueReading'
import { RecentVisited } from '~/components/home/RecentVisited'
import { Dateline } from '~/components/layout/Dateline'
import { TweetInputForm } from '~/components/tweet/TweetInputForm'
import { useVisitedStore } from '~/lib/stores/visited'
import { HOME_VISITED_LIMIT } from '~/lib/visited'

export function meta() {
  return [
    { title: 'Anon Tweet — 匿名推文浏览器 | 无需登录查看 Twitter/X 推文' },
    {
      name: 'description',
      content: `Anon Tweet — 第三方 Twitter / Instagram 查看器，专注于阅读体验和用户友好的界面设计。`,
    },
    { name: 'keywords', content: 'Twitter, X, 推文, 匿名, 翻译, AI翻译, 推文浏览器, Tweet viewer, anonymous twitter' },
  ]
}

export default function Home() {
  const items = useVisitedStore(state => state.items)
  const hasHydrated = useVisitedStore(state => state._hasHydrated)
  const clear = useVisitedStore(state => state.clear)

  const recent = hasHydrated
    ? items.slice(0, HOME_VISITED_LIMIT)
    : []
  const [latest, ...rest] = recent

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <TweetInputForm />
      <Dateline label="匿名阅读" className="w-full max-w-md px-2" />
      <ContinueReading item={latest ?? null} />
      <RecentVisited items={rest} onClear={clear} />
    </div>
  )
}
