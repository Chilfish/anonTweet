import { cn } from '~/lib/utils'

interface IGCaptionProps {
  username: string
  text: string
  tags?: string[]
  className?: string
}

/**
 * Instagram 帖子 caption 文本。
 *
 * 遵循 Twitter 卡片风格：用户名加粗 + 正文 + tags 列表。
 */
export function IGCaption({ username, text, tags, className }: IGCaptionProps) {
  if (!text)
    return null

  return (
    <div className={cn('text-sm leading-relaxed', className)}>
      <p className="whitespace-pre-wrap break-words">
        <span className="font-semibold mr-1.5">{username}</span>
        {text}
      </p>

      {tags && tags.length > 0 && (
        <p className="text-xs text-primary/70 mt-1.5 leading-relaxed">
          {tags.map(t => `#${t}`).join('  ')}
        </p>
      )}
    </div>
  )
}
