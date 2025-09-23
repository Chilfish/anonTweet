import type { ReactNode, Ref } from 'react'
import s from './tweet-container.module.css'
import './theme.css'
import { cn } from '~/lib/utils'

interface TweetContainerProps {
  children: ReactNode
  className?: string
  ref?: Ref<HTMLDivElement>
}

export const TweetContainer = ({ className, children, ref }: TweetContainerProps) => (
  <div className={cn('react-tweet-theme', s.root, className)} ref={ref}>
    <article className={s.article}>{children}</article>
  </div>
)
