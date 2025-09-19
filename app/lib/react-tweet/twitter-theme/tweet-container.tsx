import type { ReactNode } from 'react'
import s from './tweet-container.module.css'
import './theme.css'
import { cn } from '~/lib/utils'

type Props = { className?: string; children: ReactNode }

export const TweetContainer = ({ className, children }: Props) => (
  <div className={cn('react-tweet-theme', s.root, className)}>
    <article className={s.article}>{children}</article>
  </div>
)
