import type { ReactNode, Ref } from 'react'
import { cn } from '~/lib/utils'
import s from './tweet-container.module.css'
import './theme.css'

interface TweetContainerProps {
  children: ReactNode
  className?: string
  ref?: Ref<HTMLDivElement>
}

export function TweetContainer({ className, children, ref }: TweetContainerProps) {
  return (
    <div className={cn('react-tweet-theme', s.root, className)} ref={ref}>
      <article className={s.article}>{children}</article>
    </div>
  )
}
