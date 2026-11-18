import { TweetSkeleton } from '~/lib/react-tweet'
import { PageToolbarSkeleton } from './PageToolbarSkeleton'

/** 推文详情页骨架屏：操作栏 + 单条推文卡片。 */
export function TweetPageSkeleton() {
  return (
    <div className="flex w-full flex-col">
      <PageToolbarSkeleton actions={4} />
      <div className="w-full max-w-2xl">
        <TweetSkeleton />
      </div>
    </div>
  )
}
