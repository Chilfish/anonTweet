import { Languages, Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface IGCaptionProps {
  username: string
  text: string
  translatedText?: string
  tags?: string[]
  className?: string
  /** 是否正在翻译中 */
  isTranslating?: boolean
  /** 点击翻译按钮的回调 */
  onTranslate?: () => void
}

/**
 * Instagram caption 文本 + 翻译按钮。
 *
 * - 始终展开，不截断
 * - 原文 `text-foreground`，译文 `text-muted-foreground`
 * - 翻译按钮：inline Languages 图标，点击触发 onTranslate
 */
export function IGCaption({
  username,
  text,
  translatedText,
  tags,
  className,
  isTranslating,
  onTranslate,
}: IGCaptionProps) {
  if (!text)
    return null

  return (
    <div className={cn('text-sm leading-relaxed px-4 pb-3', className)}>
      {/* 原文 + 翻译按钮 */}
      <p className="whitespace-pre-wrap break-words text-foreground">
        <span className="font-semibold mr-1.5">{username}</span>
        {text}

        {/* 翻译按钮 — 有回调且未在翻译中时显示 */}
        {onTranslate && !translatedText && (
          <Button
            variant="ghost"
            size="icon"
            className="inline-flex align-middle -my-1 ml-1 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onTranslate}
            disabled={isTranslating}
            aria-label="翻译 caption"
          >
            {isTranslating
              ? <Loader2 className="size-3.5 animate-spin" />
              : <Languages className="size-3.5" />}
          </Button>
        )}
      </p>

      {/* 译文（独立行，灰色弱化） */}
      {translatedText && (
        <p className="whitespace-pre-wrap break-words text-muted-foreground mt-1.5">
          {translatedText}

          {/* 已有译文时也可以重试翻译 */}
          {onTranslate && (
            <Button
              variant="ghost"
              size="icon"
              className="inline-flex align-middle -my-1 ml-1 h-6 w-6 text-muted-foreground/50 hover:text-foreground"
              onClick={onTranslate}
              disabled={isTranslating}
              aria-label="重新翻译"
            >
              {isTranslating
                ? <Loader2 className="size-3 animate-spin" />
                : <Languages className="size-3" />}
            </Button>
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
