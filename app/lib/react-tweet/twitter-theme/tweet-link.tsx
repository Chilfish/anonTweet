import type { ReactNode } from 'react'
import { cn } from '~/lib/utils'

interface Props {
  children: ReactNode
  href: string
  className?: string
}

export function TweetLink({ href, children, className }: Props) {
  return (
    <a
      href={href}
      className={cn('tweet-link', className)}
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      {children}
    </a>
  )
}
