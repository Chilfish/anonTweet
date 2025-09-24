import type { ReactNode } from 'react'
import s from './tweet-link.module.css'

interface Props {
  children: ReactNode
  href: string
}

export function TweetLink({ href, children }: Props) {
  return (
    <a href={href} className={s.root} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  )
}
