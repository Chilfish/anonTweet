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
  onCopyText: () => void
  onCopyMarkdown: () => void
}

/**
 * Instagram 页面顶部操作栏。
 *
 * 对标 TweetHeader：左侧返回按钮，右侧操作区。
 * ```
 * [←返回]                    [翻译模式] [截图] [···]
 * ```
 */
export function IGHeader({
  post,
  translationMode,
  onTranslationModeChange,
  isCapturing,
  onScreenshot,
  onDownload,
  onCopyText,
  onCopyMarkdown,
}: IGHeaderProps) {
  const hasPost = !!post

  return (
    <div className="mb-4 flex w-full items-center justify-between gap-2 px-1 py-2 sm:mb-6 sm:px-0">
      {/* 左侧：导航 */}
      <BackButton />

      {/* 右侧：操作区 */}
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
          onDownload={onDownload}
          onCopyText={onCopyText}
          onCopyMarkdown={onCopyMarkdown}
        />
      </div>
    </div>
  )
}
