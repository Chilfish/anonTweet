import type { EnrichedTweet } from '~/types'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { cn } from '~/lib/utils'
import { TweetInfoCreatedAt } from '.'
import { VerifiedBadge } from './verified-badge'

interface Props {
  tweet: EnrichedTweet
  avatarSize?: 'small' | 'medium'
  className?: string
  createdAtInline?: boolean
}

export function TweetHeader({ tweet, avatarSize, className }: Props) {
  const { user } = tweet
  const isSmall = avatarSize === 'small'

  return (
    <div className={cn('tweet-header flex flex-row items-start', className, isSmall && 'tweet-header-in-quote')}>
      <a
        href={`https://x.com/${user.screen_name}`}
        className={cn('inline-block relative shrink-0')}
        style={{
          height: isSmall ? '34px' : '40px',
          width: isSmall ? '34px' : '40px',
        }}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Avatar
          className="w-full h-full"
        >
          <AvatarImage
            src={user.profile_image_url_https}
            alt={user.name}
          />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
      </a>

      <div className="flex flex-col flex-1 min-w-0 mx-2 h-fit gap-[0.1rem]">
        <div className="flex flex-row items-center gap-1 min-w-0">
          <a
            href={`https://x.com/${user.screen_name}`}
            className="no-underline color-inherit flex items-center hover:underline min-w-0 shrink"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="font-bold truncate" title={user.name}>
              {user.name}
            </span>
            <VerifiedBadge user={user} className="shrink-0 ml-1" />
          </a>
          <a
            href={`https://x.com/${user.screen_name}`}
            className="text-[#536471] dark:text-[#71767b] no-underline truncate text-sm shrink min-w-[3rem]"
            target="_blank"
            rel="noopener noreferrer"
            title={`@${user.screen_name}`}
          >
            @
            {user.screen_name}
          </a>
        </div>

        <div className="text-[#536471] dark:text-[#71767b] flex items-center gap-1 text-[0.85rem]">
          <TweetInfoCreatedAt tweet={tweet} />
        </div>
      </div>
    </div>
  )
}
