import { Loader2, MessageCircle } from 'lucide-react'
import { BackButton } from '~/components/translation/BackButton'
import { SaveAsImageButton } from '~/components/translation/SaveAsImageButton'
import { ToggleTransButton } from '~/components/translation/ToggleTransButton'
import { Button } from '~/components/ui/button'
import { FilterUnrelatedToggle } from './FilterUnrelatedToggle'
import { TweetOptionsMenu } from './TweetOptionsMenu'

interface TweetHeaderProps {
  isLoadingComments: boolean
  loadComments: () => Promise<void>
  hasTweets: boolean
  hasMainTweet: boolean
}

export function TweetHeader({
  isLoadingComments,
  loadComments,
  hasTweets,
  hasMainTweet,
}: TweetHeaderProps) {
  return (
    <div className="mb-4 flex w-full items-center justify-between gap-2 px-1 py-2 sm:mb-6 sm:px-0">
      {/* 左侧：导航 */}
      <BackButton />

      {/* 右侧：操作区 */}
      <div className="flex items-center gap-1 sm:gap-2">
        <FilterUnrelatedToggle />

        <Button
          variant="secondary"
          onClick={loadComments}
          disabled={!hasMainTweet || isLoadingComments}
        >
          {isLoadingComments
            ? <Loader2 className="size-4 animate-spin" />
            : <MessageCircle className="size-4" />}
          <span className="hidden sm:inline">加载评论</span>
        </Button>

        <ToggleTransButton />
        <SaveAsImageButton />

        <TweetOptionsMenu
          disableActions={!hasTweets}
        />
      </div>
    </div>
  )
}
