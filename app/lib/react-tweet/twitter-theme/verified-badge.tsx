import type { TweetUser } from '~/types'
import { cn } from '~/lib/utils'
import {
  Verified,
  VerifiedBusiness,
  VerifiedGovernment,
} from './icons/index'

interface Props {
  user: TweetUser
  className?: string
}

export function VerifiedBadge({ user, className }: Props) {
  const verified = user.verified || user.is_blue_verified || user.verified_type
  let icon = <Verified />
  let iconClassName: string | undefined = 'text-[#1d9bf0]'

  if (verified) {
    if (!user.is_blue_verified) {
      iconClassName = 'text-[rgb(130,154,171)]'
    }
    switch (user.verified_type) {
      case 'Government':
        icon = <VerifiedGovernment />
        iconClassName = 'text-[rgb(130,154,171)]'
        break
      case 'Business':
        icon = <VerifiedBusiness />
        iconClassName = undefined
        break
    }
  }

  return verified
    ? (
        <div className={cn(className, iconClassName)}>{icon}</div>
      )
    : null
}
