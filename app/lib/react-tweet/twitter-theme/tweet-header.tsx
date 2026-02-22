import type { EnrichedTweet } from '~/types'
import { MediaImage } from '~/components/ui/media'
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
    <div className={cn('tweet-header', className, isSmall && 'tweet-header-in-quote')}>
      <a
        href={`https://x.com/${user.screen_name}`}
        className={cn('inline-block relative')}
        style={{ height: isSmall ? '36px' : '40px', width: isSmall ? '36px' : '40px' }}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div
          className={cn(
            'absolute inset-0 overflow-hidden',
            user.profile_image_shape === 'Square' ? 'rounded-sm' : 'rounded-full',
            'z-10',
          )}
        >
          <MediaImage
            src={(user.profile_image_url_https)}
            alt={user.name}
            className="h-full w-full object-cover select-none pointer-events-none"
          />
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="h-full w-full transition-colors duration-200 shadow-[inset_0_0_2px_rgba(0,0,0,0.03)] hover:bg-black/15"></div>
        </div>
      </a>

      <div className="flex flex-col mx-2 h-fit gap-[0.1rem]">
        <div className="flex flex-row items-center gap-1">
          <a
            href={`https://x.com/${user.screen_name}`}
            className="no-underline color-inherit flex items-center hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="font-bold truncate whitespace-nowrap">
              <span title={user.name}>{user.name}</span>
            </div>
            <VerifiedBadge user={user} className="inline-flex ml-1" />
          </a>
          <div className="overflow-hidden truncate whitespace-nowrap">
            <a
              href={`https://x.com/${user.screen_name}`}
              className="text-[#536471] dark:text-[#71767b] no-underline truncate text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span title={`@${user.screen_name}`}>
                @
                {user.screen_name}
              </span>
            </a>
          </div>
        </div>

        <div className="text-[#536471] dark:text-[#71767b] flex items-center gap-1 text-[0.85rem]">
          <TweetInfoCreatedAt tweet={tweet} />
        </div>
      </div>
    </div>
  )
}
