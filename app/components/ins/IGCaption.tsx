import type { IGPost } from '~/types'
import { useTranslationSettings } from '~/lib/stores/hooks'
import { cn } from '~/lib/utils'
import { IGTranslateDialog } from './IGTranslateDialog'

interface IGCaptionProps {
  username: string
  text: string
  translatedText?: string
  tags?: string[]
  className?: string
  /** IGPost 完整数据，供翻译弹窗使用 */
  post?: IGPost
  /** 翻译完成回调 */
  onTranslated?: (captionTranslation: string) => void
}

/**
 * Instagram caption 文本 + 翻译分隔符 + 翻译按钮。
 *
 * - 始终展开，不截断
 * - 原文 `text-foreground`，译文 `text-muted-foreground`
 * - 译文前有自定义 HTML 分隔符（如 "由 Google 翻译自日文"）
 * - 唯一的 `Languages` 按钮（截图时自动隐藏）
 */
export function IGCaption({
  username,
  text,
  translatedText,
  tags,
  className,
  post,
  onTranslated,
}: IGCaptionProps) {
  const { customSeparator } = useTranslationSettings()

  if (!text)
    return null

  const showTranslateButton = !!post && !!onTranslated

  return (
    <div className={cn('text-sm leading-relaxed px-4 pb-3', className)}>
      {/* 原文 + 翻译入口按钮（唯一） */}
      <p className="whitespace-pre-wrap break-words text-foreground">
        <span className="font-semibold mr-1.5">{username}</span>
        {text}

        {/* 唯一翻译按钮 — 截图时隐藏 */}
        {showTranslateButton && (
          <span data-ignore-screenshot>
            <IGTranslateDialog
              post={post}
              onTranslated={onTranslated}
            />
          </span>
        )}
      </p>

      {/* 翻译分隔符 */}
      {translatedText && customSeparator && (
        <div
          className="translation-separator"
          dangerouslySetInnerHTML={{ __html: customSeparator }}
        />
      )}

      {/* 译文（独立行，灰色弱化） */}
      {translatedText && (
        <p className="whitespace-pre-wrap break-words text-muted-foreground mt-1.5">
          {translatedText}
        </p>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <p className="text-xs text-primary/70 mt-1.5 leading-relaxed">
          {tags.map(t => `#${t}`).join('  ')}
        </p>
      )}
    </div>
  )
}
