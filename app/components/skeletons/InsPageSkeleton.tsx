import { IGPostSkeleton } from '~/components/ins/IGPostSkeleton'
import { IGStoryListSkeleton } from '~/components/ins/IGStoryListSkeleton'
import { extractIGId, isIGStoryLikeId } from '~/lib/url-detect'
import { PageToolbarSkeleton } from './PageToolbarSkeleton'

/** Instagram 页骨架屏：按 id 类型切换帖子卡片 / 快拍网格。 */
export function InsPageSkeleton({ id }: { id?: string }) {
  const storyLike = id
    ? isIGStoryLikeId(extractIGId(id) ?? id)
    : false

  return (
    <>
      <PageToolbarSkeleton actions={storyLike ? 0 : 3} />
      {storyLike
        ? <IGStoryListSkeleton className="mt-4" />
        : (
            <div className="flex flex-col gap-4">
              <IGPostSkeleton />
              <IGPostSkeleton />
            </div>
          )}
    </>
  )
}
