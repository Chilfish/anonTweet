import { AboutPageSkeleton } from './AboutPageSkeleton'
import { ArticlePageSkeleton } from './ArticlePageSkeleton'
import { BiliPageSkeleton } from './BiliPageSkeleton'
import { HistoryPageSkeleton } from './HistoryPageSkeleton'
import { HomePageSkeleton } from './HomePageSkeleton'
import { InsPageSkeleton } from './InsPageSkeleton'
import { ListPageSkeleton } from './ListPageSkeleton'
import { SearchPageSkeleton } from './SearchPageSkeleton'
import { TweetPageSkeleton } from './TweetPageSkeleton'
import { UserPageSkeleton } from './UserPageSkeleton'

/**
 * 路由切换时的整页骨架屏：按**目标** pathname 选择与目标页面同形的占位。
 *
 * 仅由 layout 在 `useNavigation()` 有 pending location 时渲染。未列入的路由
 * （如 not-found）返回 null，避免闪出不相干的推文骨架。
 */
export function RouteSkeleton({ pathname }: { pathname: string }) {
  if (pathname === '/')
    return <HomePageSkeleton />

  if (pathname.startsWith('/tweets/'))
    return <TweetPageSkeleton />
  if (pathname.startsWith('/article/'))
    return <ArticlePageSkeleton />
  if (pathname.startsWith('/user/'))
    return <UserPageSkeleton />
  if (pathname.startsWith('/list/'))
    return <ListPageSkeleton />

  if (pathname.startsWith('/ins/')) {
    const segment = pathname.slice('/ins/'.length).split('/')[0]
    const id = segment
      ? decodeURIComponent(segment)
      : undefined
    return <InsPageSkeleton id={id} />
  }

  if (pathname.startsWith('/search'))
    return <SearchPageSkeleton />
  if (pathname.startsWith('/history'))
    return <HistoryPageSkeleton />
  if (pathname.startsWith('/bili'))
    return <BiliPageSkeleton />
  if (pathname.startsWith('/about'))
    return <AboutPageSkeleton />

  return null
}
