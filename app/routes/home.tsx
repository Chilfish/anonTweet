import type { Route } from './+types/home'
import { ContinueReading } from '~/components/home/ContinueReading'
import { RecentVisited } from '~/components/home/RecentVisited'
import { TweetInputForm } from '~/components/tweet/TweetInputForm'
import { buildMeta } from '~/lib/seo'
import { useVisitedStore } from '~/lib/stores/visited'
import { HOME_RECENT_LIST_LIMIT, HOME_VISITED_LIMIT } from '~/lib/visited'

export async function loader({ request }: Route.LoaderArgs) {
  return { baseUrl: new URL(request.url).origin }
}

export function meta({ loaderData }: Route.MetaArgs) {
  return buildMeta({
    title: 'Anon Tweet — 匿名推文浏览器 | 无需登录查看 Twitter/X 推文',
    description: '无需登录查看 Twitter/X 推文与 Instagram 帖子：评论线程、长文阅读、AI 双语翻译、卡片截图与 Markdown 导出。',
    canonicalPath: '/',
    baseUrl: loaderData?.baseUrl,
  })
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
      <ContinueReading item={latest ?? null} />
      <RecentVisited items={rest.slice(0, HOME_RECENT_LIST_LIMIT)} onClear={clear} />
    </div>
  )
}
