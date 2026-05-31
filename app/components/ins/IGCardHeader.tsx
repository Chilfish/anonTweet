import { BadgeCheck, Ellipsis } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { cn } from '~/lib/utils'

interface IGCardHeaderProps {
  username: string
  fullname?: string
  avatarUrl?: string
  verified?: boolean
  timestamp?: string
  locationName?: string
  className?: string
}

/**
 * Instagram 卡片头部。
 *
 * Apple HIG: w-8 h-8 rounded-full 头像 + 用户名 bold + 蓝勾认证 + 右侧三点菜单。
 * 纯展示，不依赖完整 IGPost（可复用）。
 */
export function IGCardHeader({
  username,
  fullname,
  avatarUrl,
  verified,
  timestamp,
  locationName,
  className,
}: IGCardHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* 头像 */}
      <Avatar className="size-8 shrink-0">
        {avatarUrl
          ? <AvatarImage src={avatarUrl} alt={username} />
          : <AvatarFallback>{username[0]?.toUpperCase() ?? '?'}</AvatarFallback>}
      </Avatar>

      {/* 用户名区域 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold truncate">{username}</span>
          {verified && (
            <BadgeCheck className="size-4 text-[#3896F4] fill-[#3896F4] shrink-0" />
          )}
        </div>
        {fullname && fullname !== username && (
          <p className="text-xs text-muted-foreground truncate">{fullname}</p>
        )}
        {(locationName || timestamp) && (
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {[locationName, timestamp].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* 右侧三点菜单 */}
      <button
        className="size-8 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors shrink-0"
        aria-label="更多选项"
      >
        <Ellipsis className="size-5 text-foreground/70" />
      </button>
    </div>
  )
}
