import { Skeleton } from '~/components/ui/skeleton'
import { TweetContainer } from './tweet-container'

export function TweetSkeleton() {
  return (
    <TweetContainer>
      {/* Header: Avatar + Meta */}
      <div className="flex gap-3">
        <Skeleton className="size-10 rounded-full shrink-0" />
        <div className="flex flex-col gap-1.5 pt-1 w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-3.5 w-16 rounded-md opacity-60" />
            <Skeleton className="h-6 w-6 rounded opacity-60 ml-auto" />
          </div>

        </div>
      </div>
      {/* Content Lines */}
      <div className="space-y-1.5 mt-1">
        <Skeleton className="h-4 w-[90%] rounded-md" />
        <Skeleton className="h-4 w-[80%] rounded-md" />
        <Skeleton className="h-4 w-[60%] rounded-md" />

        {/* Image */}
        <Skeleton className="mt-4 h-72 w-full rounded-md opacity-60" />
      </div>
    </TweetContainer>
  )
}
