import { cn } from '~/lib/utils'

interface IGCaptionProps {
  username: string
  text: string
  translatedText?: string
  tags?: string[]
  className?: string
}

/**
 * Instagram caption 文本。
 *
 * Apple HIG：
 * - **ALWAYS EXPANDED** — 不截断，不使用 line-clamp
 * - 原文 `text-foreground`，译文 `text-muted-foreground`
 * - 独立的 `translatedText` prop，不拼接，保持层级分明
 */
export function IGCaption({ username, text, translatedText, tags, className }: IGCaptionProps) {
  if (!text)
    return null

  return (
    <div className={cn('text-sm leading-relaxed px-4 pb-3', className)}>
      {/* 原文 */}
      <p className="whitespace-pre-wrap break-words text-foreground">
        <span className="font-semibold mr-1.5">{username}</span>
        {text}
      </p>

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
