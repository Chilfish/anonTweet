import clsx from 'clsx'
import type { EnrichedTweet } from '../utils.js'
import type { TwitterComponents } from './types.js'
import { AvatarImg } from './avatar-img.js'
import s from './tweet-header.module.css'
import { VerifiedBadge } from './verified-badge.js'
import { cn } from '~/lib/utils.js'
import { TweetInfoCreatedAt } from './components.js'

type Props = {
  tweet: EnrichedTweet
  components?: TwitterComponents
  className?: string
  createdAtInline?: boolean
}

export const TweetHeader = ({ tweet, components, className, createdAtInline }: Props) => {
  const Img = components?.AvatarImg ?? AvatarImg
  const { user } = tweet

  return (
    <div className={cn(s.header, className)}>
      <a
        href={tweet.url}
        className={s.avatar}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div
          className={clsx(
            s.avatarOverflow,
            user.profile_image_shape === 'Square' && s.avatarSquare
          )}
        >
          <Img
            src={user.profile_image_url_https}
            alt={user.name}
            width={48}
            height={48}
          />
        </div>
        <div className={s.avatarOverflow}>
          <div className={s.avatarShadow}></div>
        </div>
      </a>
      <div className={cn(s.author, createdAtInline && s.authorInline)}>
        <a
          href={tweet.url}
          className={s.authorLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className={s.authorLinkText}>
            <span title={user.name}>{user.name}</span>
          </div>
          <VerifiedBadge user={user} className={s.authorVerified} />
        </a>
        <div className={s.authorMeta}>
          <a
            href={tweet.url}
            className={s.username}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span title={`@${user.screen_name}`}>@{user.screen_name}</span>
          </a>
        </div>
        
        { createdAtInline && <div className={s.createdAt}>
          <TweetInfoCreatedAt tweet={tweet} />
        </div> }
      </div>
    </div>
  )
}
