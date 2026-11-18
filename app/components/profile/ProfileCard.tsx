import type { RawUser } from '~/types'
import { BadgeCheck, CalendarDays, ExternalLink, MapPin } from 'lucide-react'
import { RichText } from '~/components/RichText'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { MediaImage } from '~/components/ui/media'
import { normalizeProfileImageUrl } from '~/lib/media-url'

const numberFormat = new Intl.NumberFormat('zh-CN')

function formatJoined(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return ''
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月加入`
}

function Stat({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums text-foreground">
        {numberFormat.format(value)}
      </dd>
    </div>
  )
}

/** 用户资料卡：封面 / 头像 / 身份 / 简介 / 元信息 / 计数，不含时间线。 */
export function ProfileCard({ user }: { user: RawUser }) {
  const joined = formatJoined(user.createdAt)
  const initial = user.fullName?.trim().charAt(0).toUpperCase() || user.userName.charAt(0).toUpperCase()

  return (
    <article className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="relative aspect-[3/1] w-full bg-muted">
        {user.profileBanner && (
          <MediaImage
            src={user.profileBanner}
            alt={`${user.fullName} 的封面`}
            containerClassName="absolute inset-0"
            className="size-full object-cover"
          />
        )}
      </div>

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="flex items-end justify-between gap-2">
          <Avatar className="relative z-10 -mt-10 size-20 border-4 border-card bg-card shadow-sm/10 sm:-mt-12 sm:size-24">
            <AvatarImage src={normalizeProfileImageUrl(user.profileImage)} alt={user.fullName} />
            <AvatarFallback className="text-xl font-semibold">{initial}</AvatarFallback>
          </Avatar>

          <a
            href={`https://x.com/${user.userName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 pb-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            在 X 查看
            <ExternalLink className="size-3" aria-hidden />
          </a>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <h1 className="text-xl font-bold tracking-tight">{user.fullName}</h1>
          {user.isVerified && (
            <BadgeCheck
              className="size-5 shrink-0 text-primary"
              aria-label="已认证账号"
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          @
          {user.userName}
        </p>

        {user.description && (
          <RichText
            text={user.description}
            bio
            internalLinks
            className="mt-3 text-sm leading-relaxed whitespace-pre-wrap"
          />
        )}

        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {user.location && (
            <div className="flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <dt className="sr-only">所在地</dt>
              <dd className="truncate">{user.location}</dd>
            </div>
          )}
          {joined && (
            <div className="flex items-center gap-1">
              <CalendarDays className="size-3.5 shrink-0" aria-hidden />
              <dt className="sr-only">加入时间</dt>
              <dd>{joined}</dd>
            </div>
          )}
        </dl>

        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Stat label="正在关注" value={user.followingsCount} />
          <Stat label="关注者" value={user.followersCount} />
          <Stat label="帖子" value={user.statusesCount} />
        </dl>
      </div>
    </article>
  )
}
