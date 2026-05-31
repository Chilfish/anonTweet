import { BadgeCheck, Ellipsis } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { cn } from '~/lib/utils'
import InsLogo from './InsLogo'

interface IGCardHeaderProps {
  username: string
  fullname?: string
  avatarUrl?: string
  verified?: boolean
  className?: string
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
  className,
}: IGCardHeaderProps) {
  const displayName = fullname && fullname !== username ? fullname : username

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Avatar className="size-8 shrink-0">
        {avatarUrl
          ? <AvatarImage src={avatarUrl} alt={username} />
          : <AvatarFallback>{username[0]?.toUpperCase() ?? '?'}</AvatarFallback>}
      </Avatar>

      <div className="flex items-center gap-1 min-w-0 flex-1">
        <span className="text-sm font-semibold truncate">{displayName}</span>
        {verified && (
          <BadgeCheck className="size-4 text-[#3896F4] fill-[#3896F4] shrink-0" />
        )}
      </div>

      {/* 右侧：InsLogo（黑色字） + 菜单 */}
      <div className="flex items-center gap-1.5 shrink-0">
        <InsLogo className="h-3.5 w-auto text-foreground/80" />
        <button
          className="size-7 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors -mr-1"
          aria-label="更多选项"
        >
          <Ellipsis className="size-4 text-foreground/50" />
        </button>
      </div>
    </div>
  )
}
