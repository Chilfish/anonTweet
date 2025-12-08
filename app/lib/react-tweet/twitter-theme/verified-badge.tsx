import type { TweetUser } from '~/lib/react-tweet'
import clsx from 'clsx'
import {
  Verified,
  VerifiedBusiness,
  VerifiedGovernment,
} from './icons/index'
import s from './verified-badge.module.css'

interface Props {
  user: TweetUser
  className?: string
}

export function VerifiedBadge({ user, className }: Props) {
  const verified = user.verified || user.is_blue_verified || user.verified_type
  let icon = <Verified />
  let iconClassName: string | undefined = s.verifiedBlue

  if (verified) {
    if (!user.is_blue_verified) {
      iconClassName = s.verifiedOld
    }
    switch (user.verified_type) {
      case 'Government':
        icon = <VerifiedGovernment />
        iconClassName = s.verifiedGovernment
        break
      case 'Business':
        icon = <VerifiedBusiness />
        iconClassName = undefined
        break
    }
  }

  return verified
    ? (
        <div className={clsx(className, iconClassName)}>{icon}</div>
      )
    : null
}
