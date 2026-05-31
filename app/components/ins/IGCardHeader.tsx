import { BadgeCheck, Ellipsis } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { cn } from '~/lib/utils'

interface IGCardHeaderProps {
  username: string
  fullname?: string
  avatarUrl?: string
  verified?: boolean
  createdAt?: string
  className?: string
}

/**
 * Instagram 卡片头部 — 精简版。
 *
 * 一行基线对齐：头像 + 用户名(蓝勾) + 右侧时间 + 三点菜单。
 * 时间使用 Instagram 风格相对时间（"1h"/"2d"/"May 30"）。
 */
function relativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  const week = Math.floor(day / 7)

  if (sec < 60)
    return 'Just now'
  if (min < 60)
    return `${min}m`
  if (hr < 24)
    return `${hr}h`
  if (day < 7)
    return `${day}d`
  if (week < 5)
    return `${week}w`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function IGCardHeader({
  username,
  fullname,
  avatarUrl,
  verified,
  createdAt,
  className,
}: IGCardHeaderProps) {
  const displayName = fullname && fullname !== username ? fullname : username

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* 头像 */}
      <Avatar className="size-8 shrink-0">
        {avatarUrl
          ? <AvatarImage src={avatarUrl} alt={username} />
          : <AvatarFallback>{username[0]?.toUpperCase() ?? '?'}</AvatarFallback>}
      </Avatar>

      {/* 用户名 + 蓝勾 */}
      <div className="flex items-center gap-1 min-w-0">
        <span className="text-sm font-semibold truncate">{displayName}</span>
        {verified && (
          <BadgeCheck className="size-4 text-[#3896F4] fill-[#3896F4] shrink-0" />
        )}
      </div>

      {/* 右侧：时间 + 菜单 — 与左侧基线对齐 */}
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        {createdAt && (
          <span className="text-xs text-muted-foreground/60">
            {relativeTime(createdAt)}
          </span>
        )}
        <button
          className="size-7 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
          aria-label="更多选项"
        >
          <Ellipsis className="size-4 text-foreground/60" />
        </button>
      </div>
    </div>
  )
}
