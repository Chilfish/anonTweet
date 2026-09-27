import type { RefObject } from 'react'
import type { ArticleViewMode } from './ArticleBody'
import type { ArticleTranslationStatus } from '~/lib/stores/translation'
import type { EnrichedTweet, TweetArticle } from '~/types'
import { ArrowLeftIcon, CameraIcon, RotateCwIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { useScreenshotAction } from '~/hooks/use-screenshot-action'
import { ArticleOptionsMenu } from './ArticleOptionsMenu'
import { ArticleTranslateToggle } from './ArticleTranslateToggle'

interface ArticleToolbarProps {
  tweetId: string
  article: TweetArticle
  tweet: EnrichedTweet
  /** 截图捕获节点（文章卡片） */
  captureRef: RefObject<HTMLDivElement | null>
  mode: ArticleViewMode
  onModeChange: (mode: ArticleViewMode) => void
  status: ArticleTranslationStatus
  hasTranslation: boolean
  onRetry: () => void
}

/**
 * 文章阅读页工具栏：返回 + 翻译三态/重试 + 一键截图 + 更多操作。
 * 对齐推文页的 `TweetHeader`，只保留阅读长文相关的动作。
 */
export function ArticleToolbar({
  tweetId,
  article,
  tweet,
  captureRef,
  mode,
  onModeChange,
  status,
  hasTranslation,
  onRetry,
}: ArticleToolbarProps) {
  const { handleScreenshot, isCapturing } = useScreenshotAction({
    tweets: [tweet],
    captureRef,
    mainTweetOverride: tweet,
    // 文章译文由 `syncArticleTranslation` 单独落库，不走实体翻译同步
    syncTranslations: false,
  })

  const canToggle = hasTranslation || status === 'loading'

  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <Link
        to={`/tweets/${tweetId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        返回推文
      </Link>

      <div className="flex items-center gap-1 sm:gap-2">
        {status === 'loading' && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Spinner className="size-3.5" />
            翻译中
          </span>
        )}

        {status === 'error' && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RotateCwIcon className="size-4" />
            <span className="hidden sm:inline">重试翻译</span>
          </Button>
        )}

        {canToggle && (
          <ArticleTranslateToggle mode={mode} onModeChange={onModeChange} />
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleScreenshot(false)}
          disabled={isCapturing}
        >
          {isCapturing ? <Spinner className="size-4" /> : <CameraIcon className="size-4" />}
          <span className="hidden sm:inline">{isCapturing ? '截图中' : '截图'}</span>
        </Button>

        <ArticleOptionsMenu article={article} tweet={tweet} />
      </div>
    </div>
  )
}
