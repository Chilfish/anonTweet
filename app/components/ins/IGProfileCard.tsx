import type { IGProfile } from '~/types'
import { BadgeCheck, ExternalLink, Lock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { proxyIGImage } from '~/lib/ig/proxyImage'
import { cn } from '~/lib/utils'
import InsLogo from './InsLogo'

interface IGProfileCardProps {
  profile: IGProfile
  className?: string
}

const compactNumber = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

function Stat({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-semibold tabular-nums">{compactNumber.format(value)}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

/**
 * Instagram 主页资料卡：头像 / 显示名 / @用户名 / 简介 / 帖子·粉丝·关注。
 *
 * 与帖子卡共用 `rounded-2xl` + `bg-card` 外壳；头像走图片代理绕开 IG CDN 的 CORP 拦截。
 */
export function IGProfileCard({ profile, className }: IGProfileCardProps) {
  const displayName = profile.fullname && profile.fullname !== profile.username
    ? profile.fullname
    : profile.username

  return (
    <article
      data-slot="ig-profile-card"
      className={cn(
        'mx-auto w-full max-w-[600px] overflow-hidden rounded-2xl border border-border/60 bg-card',
        className,
      )}
    >
      <div className="flex items-start gap-4 px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
        <Avatar className="size-16 shrink-0 sm:size-20">
          {profile.avatarUrl
            ? <AvatarImage src={proxyIGImage(profile.avatarUrl)} alt={profile.username} />
            : <AvatarFallback>{profile.username[0]?.toUpperCase() ?? '?'}</AvatarFallback>}
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-base font-semibold">{displayName}</span>
            {profile.verified && (
              <BadgeCheck className="size-4 shrink-0 fill-[#3896F4] text-white" />
            )}
            <InsLogo className="ml-auto h-7 w-auto shrink-0 text-foreground/80" />
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="truncate">{`@${profile.username}`}</span>
            {profile.isPrivate && <Lock className="size-3 shrink-0" aria-label="私有账号" />}
          </div>

          <div data-slot="ig-profile-stats" className="mt-1.5 flex items-center gap-6">
            <Stat label="帖子" value={profile.mediaCount} />
            <Stat label="粉丝" value={profile.followers} />
            <Stat label="关注" value={profile.following} />
          </div>
        </div>
      </div>

      {profile.biography && (
        <p className="whitespace-pre-line px-4 pb-3 text-sm leading-relaxed sm:px-5">
          {profile.biography}
        </p>
      )}

      {profile.externalUrl && (
        <a
          href={profile.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-4 mb-4 inline-flex max-w-[calc(100%-2rem)] items-center gap-1 text-sm font-medium text-primary hover:underline sm:mx-5"
        >
          <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{profile.externalUrl}</span>
        </a>
      )}
    </article>
  )
}
