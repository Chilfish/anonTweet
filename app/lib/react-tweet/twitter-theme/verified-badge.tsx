import type { TweetUser } from '~/types'
import clsx from 'clsx'
import { Verified } from './icons/verified'
import { VerifiedBusiness } from './icons/verified-business'
import { VerifiedGovernment } from './icons/verified-government'
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
