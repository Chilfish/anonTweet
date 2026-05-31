import type { IGPost } from '~/types'
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
 * Instagram caption 文本 + 翻译按钮。
 *
 * - 始终展开，不截断
 * - 原文 `text-foreground`，译文 `text-muted-foreground`
 * - `Languages` 图标按钮 → 打开 IGTranslateDialog 弹窗
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
  if (!text)
    return null

  return (
    <div className={cn('text-sm leading-relaxed px-4 pb-3', className)}>
      {/* 原文 + 翻译入口按钮 */}
      <p className="whitespace-pre-wrap break-words text-foreground">
        <span className="font-semibold mr-1.5">{username}</span>
        {text}

        {/* 翻译按钮 — 打开弹窗 */}
        {post && onTranslated && (
          <IGTranslateDialog
            post={post}
            onTranslated={onTranslated}
          />
        )}
      </p>

      {/* 译文（独立行，灰色弱化） */}
      {translatedText && (
        <p className="whitespace-pre-wrap break-words text-muted-foreground mt-1.5">
          {translatedText}

          {/* 已有译文时也显示翻译入口（重新翻译） */}
          {post && onTranslated && (
            <IGTranslateDialog
              post={{ ...post, captionTranslation: translatedText }}
              onTranslated={onTranslated}
            />
          )}
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
