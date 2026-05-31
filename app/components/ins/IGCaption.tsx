import type { IGPost } from '~/types'
import { useTranslationSettings } from '~/lib/stores/hooks'
import { cn } from '~/lib/utils'
import { RichText } from '../RichText'
import { IGTranslateDialog } from './IGTranslateDialog'

interface IGCaptionProps {
  username: string
  text: string
  translatedText?: string
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
      <p className="whitespace-pre-wrap wrap-break-words text-foreground">
        <div>
          <span className="font-semibold mr-1.5">
            @
            {username}
          </span>

          {/* 唯一翻译按钮 — 截图时隐藏 */}
          {showTranslateButton && (
            <span data-ignore-screenshot>
              <IGTranslateDialog
                post={post}
                onTranslated={onTranslated}
              />
            </span>
          )}
        </div>

        <RichText
          text={text}
        />
      </p>

      {/* 翻译分隔符 */}
      {translatedText && customSeparator && (
        <div
          className="translation-separator"
          dangerouslySetInnerHTML={{ __html: customSeparator }}
        />
      )}

      {/* 译文（独立行） */}
      {translatedText && (
        <RichText
          text={translatedText}
          className="whitespace-pre-wrap wrap-break-words font-bold"
        >
        </RichText>
      )}
    </div>
  )
}
