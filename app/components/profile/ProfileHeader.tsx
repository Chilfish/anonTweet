import type { RawUser } from '~/types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ArrowLeft, BalloonIcon, CalendarDays, LinkIcon, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { TweetText } from '../tweet/TweetText'

interface ProfileHeaderProps {
  user: RawUser
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const navigate = useNavigate()
  const formattedDate = user.createdAt
    ? format(new Date(user.createdAt), 'yyyy年M月', { locale: zhCN })
    : ''

  return (
    <div className="flex flex-col w-full border-b border-border bg-background">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 flex items-center gap-8 px-4 h-12 bg-background/80 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full size-8 shrink-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-bold leading-tight truncate">
          {user.fullName}
        </h1>
      </div>

      {/* Banner */}
      <div className="relative aspect-3/1 w-full bg-muted overflow-hidden">
        {user.profileBanner ? (
          <img
            src={user.profileBanner}
            alt={`${user.fullName} 的封面`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-200 dark:bg-slate-800" />
        )}
      </div>

      {/* Profile Info Section */}
      <div className="px-4 pb-4">
        <div className="relative flex justify-between items-start h-16 sm:h-20">
          {/* Avatar - Twitter style overlapping the banner */}
          <div className="absolute -top-[50%] left-0 sm:-top-[60%]">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background bg-background ring-offset-background">
              <AvatarImage src={user.profileImage} alt={user.fullName} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-muted">
                {user.fullName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* User Identity */}
        <div className="mt-4 sm:mt-6 flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <h2 className="text-xl font-extrabold tracking-tight leading-7">
              {user.fullName}
            </h2>
            {user.isVerified && (
              <svg viewBox="0 0 24 24" aria-label="验证账号" className="w-[18.75px] h-[18.75px] fill-primary shrink-0">
                <g><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.97-.81-4.01s-2.62-1.27-4.01-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.98-.2-4.02.81s-1.27 2.62-.81 4.01c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.33c-.46 1.4-.2 2.98.81 4.02s2.62 1.27 4.01.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.33-2.19c1.4.46 2.98.2 4.02-.81s1.27-2.62.81-4.01c1.31-.67 2.19-1.91 2.19-3.33zM10.5 17L6 12.5l1.5-1.5 3 3 7.5-7.5 1.5 1.5L10.5 17z"></path></g>
              </svg>
            )}
          </div>
          <p className="text-[15px] text-muted-foreground">
            @
            {user.userName}
          </p>
        </div>

        {/* Bio */}
        {user.description && (
          <TweetText
            text={user.description}
            className="text-4"
          />
        )}

        {/* Meta info (Location, Join Date) */}
        <div className="mt-3 flex flex-col gap-x-4 gap-y-1 text-[15px] text-muted-foreground">
          {user.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{user.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <CalendarDays className="w-4 h-4 shrink-0" />
            <span>
              {formattedDate}
              {' '}
              加入
            </span>
            {
              user.birthdayString && (
                <div className="flex items-center gap-1 ml-3">
                  <BalloonIcon className="size-4 shrink-0" />
                  <span>
                    出生于
                    {' '}
                    {user.birthdayString.split('/').join('月')}
                    日
                  </span>
                </div>
              )
            }
          </div>
        </div>
        {
          user.url && (
            <div className="flex items-center gap-1 mt-1">
              <LinkIcon className="size-4 shrink-0" />
              <a
                href={user.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
              >
                {user.url}
              </a>
            </div>
          )
        }

        {/* Following/Followers Count */}
        <div className="mt-3 flex gap-4 text-[15px]">
          <div className="hover:underline cursor-pointer flex gap-1 decoration-foreground">
            <span className="font-bold text-foreground">{user.followingsCount.toLocaleString()}</span>
            <span className="text-muted-foreground">正在关注</span>
          </div>
          <div className="hover:underline cursor-pointer flex gap-1 decoration-foreground">
            <span className="font-bold text-foreground">{user.followersCount.toLocaleString()}</span>
            <span className="text-muted-foreground">关注者</span>
          </div>
          <div className="hover:underline cursor-pointer flex gap-1 decoration-foreground">
            <span className="font-bold text-foreground">{user.statusesCount.toLocaleString()}</span>
            <span className="text-muted-foreground">帖子</span>
          </div>
        </div>
      </div>
    </div>
  )
}
