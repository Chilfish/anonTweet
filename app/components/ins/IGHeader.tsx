import type { IGTranslationMode } from './IGTranslateToggle'
import type { IGPost } from '~/types'
import { BackButton } from '~/components/translation/BackButton'
import { IGOptionsMenu } from './IGOptionsMenu'
import { IGScreenshotButton } from './IGScreenshotButton'
import { IGTranslateToggle } from './IGTranslateToggle'

interface IGHeaderProps {
  post: IGPost | null
  translationMode: IGTranslationMode
  onTranslationModeChange: (mode: IGTranslationMode) => void
  isCapturing: boolean
  onScreenshot: () => void
  onDownload: () => void
  onShare: () => void
  onShareScreenshot: () => void
  onCopyText: () => void
  onCopyMarkdown: () => void
  /** 快拍/精选集列表模式：只保留返回按钮（下载操作在 IGStoryList 内）。 */
  storyMode?: boolean
}

/**
 * Instagram 页面顶部操作栏。
 *
 * 对标 TweetHeader：左侧返回按钮，右侧操作区。
 * ```
 * [←返回]                    [翻译模式] [截图] [···]
 * ```
 * `storyMode` 下右侧操作区整体隐藏（快拍只保留下载，操作在列表内）。
 */
export function IGHeader({
  post,
  translationMode,
  onTranslationModeChange,
  isCapturing,
  onScreenshot,
  onDownload,
  onShare,
  onShareScreenshot,
  onCopyText,
  onCopyMarkdown,
  storyMode = false,
}: IGHeaderProps) {
  const hasPost = !!post

  return (
    <div className="mb-4 flex w-full items-center justify-between gap-2 px-1 py-2 sm:mb-6 sm:px-0">
      {/* 左侧：导航 */}
      <BackButton />

      {/* 右侧：操作区（快拍列表模式下隐藏） */}
      {!storyMode && (
        <div className="flex items-center gap-1 sm:gap-2">
          <IGTranslateToggle
            mode={translationMode}
            onModeChange={onTranslationModeChange}
            disabled={!hasPost}
          />

          <IGScreenshotButton
            isCapturing={isCapturing}
            onScreenshot={onScreenshot}
          />

          <IGOptionsMenu
            disableActions={!hasPost}
            isCapturing={isCapturing}
            onDownload={onDownload}
            onShare={onShare}
            onShareScreenshot={onShareScreenshot}
            onCopyText={onCopyText}
            onCopyMarkdown={onCopyMarkdown}
          />
        </div>
      )}
    </div>
  )
}
