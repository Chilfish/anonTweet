import { BadgeCheck } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { cn } from '~/lib/utils'
import InsLogo from './InsLogo'

interface IGCardHeaderProps {
  username: string
  fullname?: string
  avatarUrl?: string
  verified?: boolean
  /** 名称下方的一行上下文（如 `@user · 快拍`） */
  subtitle?: React.ReactNode
  className?: string
}

/**
 * 将 Instagram CDN 图片 URL 转为同源代理 URL。
 * 解决 `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` CORS 拦截。
 */
function proxyImage(url: string): string {
  if (url.includes('cdninstagram.com') || url.includes('fbcdn.net')) {
    return `/api/proxy/image?url=${encodeURIComponent(url)}`
  }
  return url
}

/**
 * Instagram 卡片头部 — 单行紧凑。
 *
 * [头像] [用户名 ✓] — flex-1 长昵称 truncate — [InsLogo] [···]
 */
export function IGCardHeader({
  username,
  fullname,
  avatarUrl,
  verified,
  subtitle,
  className,
}: IGCardHeaderProps) {
  const displayName = fullname && fullname !== username
    ? fullname
    : username

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* 头像 — 走代理绕过 IG CDN 的 CORP 拦截 */}
      <Avatar className="size-8 shrink-0">
        {avatarUrl
          ? <AvatarImage src={proxyImage(avatarUrl)} alt={username} />
          : <AvatarFallback>{username[0]?.toUpperCase() ?? '?'}</AvatarFallback>}
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate text-sm font-semibold">{displayName}</span>
          {verified && (
            <BadgeCheck className="size-4 shrink-0 fill-[#3896F4] text-white" />
          )}
        </div>
        {subtitle && (
          <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>

      {/* 右侧：InsLogo */}
      <InsLogo className="h-8 w-auto text-foreground/80" />
    </div>
  )
}
